"""POC opt-in: exploracao visual do Nova Wing por Deep Agents + Stagehand.

Este arquivo nao altera o jogo, nao publica releases e nao executa em CI.
"""
import argparse
import asyncio
from datetime import datetime, timezone
import os
from pathlib import Path
import time
from urllib.parse import urlparse
from urllib.request import urlopen

SCENARIOS = {
    "menu-desktop": """
Navegue pela capa, pressione PRESS START, visite o hangar e suas abas
(PILOTOS, NAVES e ARSENAL), volte ao menu e explore as opcoes.
Verifique elementos encobertos, scroll excessivo, botoes sem resposta e
possiveis textos misturados. Nao compre itens nem altere arquivos.
""",
    "mobile-hud": """
Use o viewport horizontal de celular. Inicie uma partida como visitante,
se possivel, e avalie botoes de TIRO, BOOST, ROBÔ e pausa.
Verifique se os controles ficam acessiveis, se o HUD encobre a area
central de jogo e se menus permanecem utilizaveis sem scroll excessivo.
Se um passo nao for acessivel, registre o bloqueio sem inventar resultados.
""",
    "rpg-orbit": """
Explore a opcao de QA/testar fases SOMENTE se aparecer no menu local.
Se disponivel, escolha um encontro com chefe, abra o drawer RPG e
tente fecha-lo para liberar os botoes de orbitar.
Verifique visibilidade e interacao de orbitLeft e orbitRight.
Nao declare validada a rotacao do chefe ou seus pontos fracos apenas por
uma captura do canvas: isso exige instrumentacao/telemetria especifica.
Se nao puder chegar ao combate, registre como NAO TESTADO.
""",
}

SYSTEM_PROMPT = """
Voce e um explorador de QA para Nova Wing 3D, em ambiente local.
Sua unica autorizacao e navegar no aplicativo pelo browser Stagehand.
Nao altere arquivos, repositorio, preferencias externas, releases ou
credenciais. Nao abra sites externos, nao use login real e nao tente
efetuar pagamentos. Nao execute shell ou scripts locais.
Use screenshots para inspecionar canvas WebGL e snapshots para DOM.
Nao afirme que um comportamento passou sem observacao direta.
Ao final, devolva um relatorio em portugues com:
1. PASSOU / FALHOU / BLOQUEADO / NAO TESTADO por checkpoint.
2. Passos reproduziveis, comportamento esperado e observado.
3. Severidade (P0 a P3), evidencias e limitacoes.
4. Sugestoes de novos testes deterministas Playwright.
Evite respostas longas e procure defeitos, nao apenas caminhos felizes.
"""


def validate_local_url(value: str) -> str:
    parsed = urlparse(value)
    if (
        parsed.scheme != "http"
        or parsed.hostname not in {"localhost", "127.0.0.1"}
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
        or parsed.path not in {"", "/"}
        or parsed.port is None
    ):
        raise ValueError("Use apenas http://127.0.0.1:4173/ ou outra porta HTTP local.")
    return value.rstrip("/") + "/"


def preflight(url: str) -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("Defina OPENAI_API_KEY no ambiente; nao inclua a chave no repositorio.")
    try:
        with urlopen(url, timeout=5) as response:
            if response.status != 200:
                raise RuntimeError(f"Servidor local retornou HTTP {response.status}.")
    except OSError as exc:
        raise RuntimeError(
            "Nova Wing local indisponivel. Rode npm ci && npm run build && npm run dev."
        ) from exc


def last_response(result: dict) -> str:
    messages = result.get("messages", [])
    if not messages:
        return "Sem mensagem final do agente; verificar traces."
    content = messages[-1].content
    return content if isinstance(content, str) else repr(content)


async def explore(args: argparse.Namespace, url: str) -> str:
    # Imports tardios: --help e preflight funcionam sem instalar pacotes Python.
    from deepagents import create_deep_agent
    from langchain.agents.middleware import ModelCallLimitMiddleware
    from langchain_stagehand import StagehandMiddleware
    from stagehand import Stagehand, local_browser

    mobile = args.scenario != "menu-desktop"
    browser = await local_browser.launch(
        headless=not args.show_browser,
        viewport_width=844 if mobile else 1366,
        viewport_height=390 if mobile else 768,
        has_touch=mobile,
        device_scale_factor=1.0,
    )
    try:
        stagehand = await Stagehand.create(
            browser=browser,
            model=args.browser_model,
            model_api_key=os.environ["OPENAI_API_KEY"],
        )
        try:
            agent = create_deep_agent(
                model=args.model,
                system_prompt=SYSTEM_PROMPT,
                middleware=[
                    StagehandMiddleware(stagehand=stagehand),
                    ModelCallLimitMiddleware(
                        run_limit=args.max_model_calls,
                        exit_behavior="end",
                    ),
                ],
            )
            task = (
                f"Abra {url} no browser local e execute o cenario "
                f"{args.scenario}:\n{SCENARIOS[args.scenario]}\n"
                "Nao navegue para outro host. Use apenas dados sinteticos."
            )
            result = await agent.ainvoke(
                {"messages": [{"role": "user", "content": task}]},
                config={"recursion_limit": 45},
            )
            return last_response(result)
        finally:
            await stagehand.close()
    finally:
        await browser.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Nova Wing: agente exploratorio local")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), default="menu-desktop")
    parser.add_argument("--url", default="http://127.0.0.1:4173/")
    parser.add_argument("--model", default=os.getenv("NOVA_QA_MODEL", "openai:gpt-5.5"))
    parser.add_argument(
        "--browser-model",
        default=os.getenv("NOVA_QA_BROWSER_MODEL", "openai/gpt-5.4-mini"),
        help="Modelo usado pelo Stagehand local, diferente do modelo Deep Agents.",
    )
    parser.add_argument("--max-model-calls", type=int, default=10)
    parser.add_argument("--show-browser", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.max_model_calls <= 20:
        parser.error("--max-model-calls deve estar entre 1 e 20.")
    try:
        url = validate_local_url(args.url)
        preflight(url)
    except (ValueError, RuntimeError) as exc:
        parser.error(str(exc))
    started = time.perf_counter()
    try:
        report = asyncio.run(explore(args, url))
    except Exception as exc:
        report = f"EXECUCAO BLOQUEADA: {type(exc).__name__}: {exc}"
    elapsed = round(time.perf_counter() - started, 1)
    outdir = Path("artifacts/agent-qa")
    outdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output = outdir / f"{stamp}-{args.scenario}.md"
    output.write_text(
        f"# Nova Wing | Deep Agents exploratory QA\n\n"
        f"- Data UTC: {stamp}\n"
        f"- Scenario: {args.scenario}\n"
        f"- Deep Agents model: {args.model}\n"
        f"- Stagehand model: {args.browser_model}\n"
        f"- URL: {url}\n"
        f"- Duration seconds: {elapsed}\n"
        f"- Model call limit: {args.max_model_calls}\n"
        f"- API cost: nao apurado (consultar provedor/LangSmith)\n"
        f"- Status: relatorio exploratorio, NAO e gate de CI\n\n"
        f"## Observacoes do agente (ainda exigem revisao)\n\n{report}\n",
        encoding="utf-8",
    )
    print(f"Relatorio: {output}\n{report}")
    if report.startswith("EXECUCAO BLOQUEADA:"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
