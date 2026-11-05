"""POC QA Nova Wing: Deep Agents + Stagehand + Ollama, 100% inference local.

Nenhuma API externa de modelos e usada. Nao faz deploy nem altera o jogo.
"""
import argparse
import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
from urllib.parse import urlparse
from urllib.request import urlopen

OLLAMA_URL = "http://127.0.0.1:11434"
SCENARIOS = {
    "menu-desktop": (
        "Abra PRESS START, visite HANGAR e suas abas PILOTOS/NAVES/ARSENAL, "
        "volte ao menu e explore OPCOES. Procure botoes inativos, scroll "
        "excessivo e textos misturados. Nao compre nem modifique nada."
    ),
    "mobile-hud": (
        "No viewport horizontal de celular, inicie como visitante, se "
        "possivel. Verifique visibilidade e clique de TIRO, BOOST, ROBO, "
        "pausa, menu e HUD. Busque sobreposicoes e scroll indesejado."
    ),
    "rpg-orbit": (
        "Se TESTAR FASES/QA estiver disponivel no menu local, abra uma batalha "
        "contra chefe. Teste abrir e fechar RPG, e se ORBITAR fica novamente "
        "acessivel. Se nao houver o cenario, registre NAO TESTADO; nao "
        "invente que fisica ou rotacao 3D do chefe foram verificadas."
    ),
}
SYSTEM = (
    "Voce e QA exploratorio do jogo Nova Wing. Use SOMENTE o browser local "
    "Stagehand. Nao use shell, login real, sites externos, links pagos, "
    "arquivos, contas de usuario ou alteracoes no codigo. Inspecione DOM e "
    "screenshots WebGL, mas nunca diga que avaliou fisica 3D apenas por imagem. "
    "Relate PASSOU/FALHOU/BLOQUEADO/NAO TESTADO, passos reproduziveis, "
    "esperado/observado, severidade P0-P3, evidencias e limites. "
    "Sugira testes Playwright deterministas para cada falha confirmavel."
)


def validate_url(raw: str) -> str:
    u = urlparse(raw)
    if (
        u.scheme != "http"
        or u.hostname not in ("127.0.0.1", "localhost")
        or u.port is None
        or u.path not in ("", "/")
        or u.username
        or u.password
        or u.fragment
        or u.query
    ):
        raise ValueError("O jogo deve usar http://127.0.0.1:4173/ (HTTP local).")
    return raw.rstrip("/") + "/"


def preflight(url: str, model: str) -> None:
    if model.endswith(":cloud") or "/" in model:
        raise RuntimeError("Modelo nao permitido. Use um modelo Ollama LOCAL, ex: qwen3.5:4b.")
    try:
        with urlopen(OLLAMA_URL + "/api/tags", timeout=5) as r:
            tags = json.load(r)
    except OSError as exc:
        raise RuntimeError("Ollama local nao responde em 127.0.0.1:11434. Instale e inicie Ollama.") from exc
    installed = {m.get("name") for m in tags.get("models", [])}
    if model not in installed:
        raise RuntimeError(
            f"Modelo '{model}' ausente. Execute 'ollama pull {model}'. "
            f"Modelos locais disponiveis: {sorted(installed)}"
        )
    try:
        with urlopen(url, timeout=5) as r:
            if r.status != 200:
                raise RuntimeError(f"Jogo retornou HTTP {r.status}")
    except OSError as exc:
        raise RuntimeError("Jogo local indisponivel. Rode npm ci, npm run build e npm run dev.") from exc


def local_stagehand_model(model: str):
    from ollama import AsyncClient
    from stagehand import LLMStructuredGenerateResult

    ollama = AsyncClient(host=OLLAMA_URL)

    async def generate(params):
        response_format = params.response_format
        if response_format is None:
            raise TypeError("Stagehand sem schema: nao habilitar fallback em nuvem.")
        messages = []
        if params.system_prompt:
            messages.append({"role": "system", "content": params.system_prompt})
        for message in params.messages:
            blocks = message.content if isinstance(message.content, list) else [message.content]
            texts, images = [], []
            for block in blocks:
                part = block.root
                if part.type == "text":
                    texts.append(part.text)
                elif part.type == "image":
                    images.append(part.data)
            m = {"role": message.role.value, "content": "\n".join(texts)}
            if images:
                m["images"] = images
            messages.append(m)
        reply = await ollama.chat(
            model=model,
            messages=messages,
            format=response_format.schema_.model_dump(),
            options={"temperature": params.temperature if params.temperature is not None else 0},
            stream=False,
        )
        content = reply.message.content or ""
        return LLMStructuredGenerateResult.model_validate({
            "role": "assistant",
            "content": {"type": "text", "text": content},
            "output_format": "json_schema",
            "structured_content": json.loads(content),
        })

    return generate


async def explore(args, url: str) -> str:
    from deepagents import create_deep_agent
    from langchain.agents.middleware import ModelCallLimitMiddleware
    from langchain_ollama import ChatOllama
    from langchain_stagehand import StagehandMiddleware
    from stagehand import Stagehand, local_browser

    mobile = args.scenario != "menu-desktop"
    browser = await local_browser.launch(
        headless=not args.show_browser,
        viewport_width=844 if mobile else 1366,
        viewport_height=390 if mobile else 768,
        device_scale_factor=1.0,
        has_touch=mobile,
    )
    try:
        stagehand = await Stagehand.create(
            browser=browser, model=local_stagehand_model(args.model)
        )
        try:
            agent = create_deep_agent(
                model=ChatOllama(
                    model=args.model,
                    base_url=OLLAMA_URL,
                    temperature=0,
                    num_ctx=16384,
                ),
                system_prompt=SYSTEM,
                middleware=[
                    StagehandMiddleware(stagehand=stagehand),
                    ModelCallLimitMiddleware(
                        run_limit=args.max_model_calls,
                        exit_behavior="end",
                    ),
                ],
            )
            response = await agent.ainvoke(
                {"messages": [{
                    "role": "user",
                    "content": (
                        f"Abra APENAS {url} e execute o cenario "
                        f"{args.scenario}: {SCENARIOS[args.scenario]}"
                    ),
                }]},
                config={"recursion_limit": 45},
            )
            messages = response.get("messages", [])
            if not messages:
                return "BLOQUEADO: sem resposta do agente."
            answer = messages[-1].content
            return answer if isinstance(answer, str) else repr(answer)
        finally:
            await stagehand.close()
    finally:
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="Nova Wing QA: IA e navegador local")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), default="menu-desktop")
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--model", default="qwen3.5:4b")
    parser.add_argument("--max-model-calls", type=int, default=8)
    parser.add_argument("--show-browser", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.max_model_calls <= 20:
        parser.error("Use --max-model-calls entre 1 e 20.")
    # Nunca emitir traces para LangSmith; a POC local nao usa nuvem.
    os.environ["LANGSMITH_TRACING"] = "false"
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    try:
        url = validate_url(args.url)
        preflight(url, args.model)
    except (ValueError, RuntimeError) as exc:
        parser.error(str(exc))

    start = time.perf_counter()
    try:
        report = asyncio.run(explore(args, url))
        error = False
    except Exception as exc:
        report = f"BLOQUEADO: {type(exc).__name__}: {exc}"
        error = True
    duration = round(time.perf_counter() - start, 1)
    # Resolve from the repository, not the shell current working directory.
    folder = Path(__file__).resolve().parents[1] / "artifacts" / "agent-qa"
    folder.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = folder / f"{stamp}-{args.scenario}.md"
    path.write_text(
        "# Nova Wing | QA local (Ollama + Deep Agents + Stagehand)\n\n"
        f"- Data: {stamp} UTC\n- Cenario: {args.scenario}\n"
        f"- Modelo local: {args.model}\n- Servico: {OLLAMA_URL}\n"
        f"- Jogo: {url}\n- Duracao: {duration}s\n"
        f"- Max. chamadas de modelo: {args.max_model_calls}\n"
        "- API paga: nenhuma\n- Estado: exploratorio, sem homologacao automatica\n\n"
        "## Observacoes do agente (exigem reproducao)\n\n"
        f"{report}\n",
        encoding="utf-8",
    )
    # Machine-readable sidecar for reporting; the LLM narrative is NOT a
    # verified finding. Ollama token/energy usage is not currently instrumented.
    metadata = {
        "schema_version": 1,
        "timestamp_utc": stamp,
        "scenario": args.scenario,
        "model": args.model,
        "provider": "ollama-local",
        "duration_seconds": duration,
        "max_model_calls": args.max_model_calls,
        "status": "BLOQUEADO" if error else "RELATO_NAO_VALIDADO",
        "report_file": path.name,
        "model_calls_actual": None,
        "tokens_actual": None,
        "cost_usd": None,
        "automatically_verified": False,
    }
    sidecar = path.with_suffix(".json")
    sidecar.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Relatorio: {path}\nDados: {sidecar}\n\n{report}")
    if error:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
