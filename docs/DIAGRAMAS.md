# Arquitetura ilustrada · Nova Wing 3D

**Como as partes do produto e do processo se conectam.** Os diagramas são mantidos em Mermaid no Git: versionáveis, comparáveis em PR e renderizados diretamente no GitHub.

[Voltar à documentação](README.md) · [Portfolio AI SDLC](PORTFOLIO-AI-SDLC.md) · [Arquitetura detalhada](ARCHITECTURE-PLATFORM.md)

## 1 · Runtime e integrações

```mermaid
flowchart LR
  PLAYER["Piloto · desktop / mobile"] --> UI["HTML / CSS / controles"]
  UI --> GAME["createGame · gameplay"]
  GAME --> VISUAL["Three.js · WebGL"]
  GAME --> MUSIC["Web Audio · músicas e SFX"]
  GAME --> STATE["Campanha / progressão / checkpoint"]
  STATE --> LOCAL[("localStorage")]
  UI -. autenticação por ambiente .-> FIREBASE["Firebase Auth · Google"]
  UI -. ranking experimental .-> WORKER["Cloudflare Worker · API"]
  WORKER -. valida token .-> FIREBASE
  WORKER -. exige backend configurado .-> D1[("Cloudflare D1")]
```

**Legenda:** setas contínuas representam o fluxo local implementado; setas pontilhadas representam integrações dependentes do ambiente, configuração e validação. O código do Worker não é prova de que um banco ou endpoint esteja operacional.

## 2 · Fonte, build e QA em camadas

```mermaid
flowchart TD
  SPEC["Feedback + specs/"] --> SOURCE["src/ · fonte editável"]
  CONTEXT["AGENTS.md + skills/"] -. orienta .-> SOURCE
  SOURCE --> TEST["tests/harness.mjs"]
  SOURCE --> BUILD["tools/build.mjs · esbuild"]
  BUILD --> HTML["index.html · artefato gerado"]
  HTML --> CHECK["build:check · reprodução"]
  TEST --> QUALITY["quality: Node / lint / invariantes"]
  CHECK --> QUALITY
  HTML --> BROWSER["Playwright · 4 shards"]
  QUALITY --> GATE{"Gate CI"}
  BROWSER --> GATE
  GATE -->|Falha| SOURCE
  GATE -->|Aprovado| REVIEW["PR e revisão"]
  REVIEW --> PREVIEW["Cloudflare DEV / PR"]
  PREVIEW --> HUMAN["Inspeção humana"]
  HUMAN -. aceite explícito .-> RELEASE["HML → main / PROD"]
```

O workflow real está em [`.github/workflows/ci.yml`](../.github/workflows/ci.yml); o pipeline Cloudflare usa [`cloudflare-preview.yml`](../.github/workflows/cloudflare-preview.yml). O deploy DEV isolado não executa necessariamente os quatro shards de navegador no mesmo workflow; para promoção, verifique a CI do **mesmo SHA**.

## 3 · Aprendizado e handoff: estado real x proposta

```mermaid
flowchart LR
  subgraph CURRENT["Implementado hoje"]
    A["Contexto versionado"] --> B["Implementação supervisionada"]
    B --> C["Testes + CI"]
    C --> D["PR + deploy verificável"]
  end
  subgraph FUTURE["Modelo de evolução"]
    E["Discovery"] --> F["Arquitetura / spec"]
    F --> G["Agente de implementação"]
    G --> H["Agente de verificação"]
    H --> I["Revisão + aprovação humana"]
  end
  D -. feedback .-> A
  D -. instrumentar papéis .-> E
```

As skills de domínio não são agentes residentes. O desenho de vários papéis é uma **arquitetura futura de orquestração**, cuja viabilidade depende de instrumentação de custo, tempo, rastros e limites de permissão. Leia [Papéis e handoffs](case/PAPEIS-E-HANDOFFS.md).

## 4 · Ambientes sem ambiguidade

| Ambiente | Branch | Hospedagem | Papel |
| :--- | :--- | :--- | :--- |
| PR preview | Branch da PR | Cloudflare Pages | Avaliação de mudança isolada |
| DEV | `dev` | Cloudflare Pages | Integração e feedback rápido |
| HML | `hml` | Cloudflare Pages | Homologação controlada |
| PROD | `main` | GitHub Pages | Release pública |

O estado por versão e a evidência de cada deploy estão em [Ambientes](DEPLOY-ENVIRONMENTS.md). **Publicado ≠ testado ≠ homologado**.

---

**Evidência do fluxo:** [Ciclo real de outubro de 2026](case/CICLO-REAL-OUTUBRO-2026.md) · [Matriz de evidências](case/EVIDENCIAS.md).
