# SDK do backend

- Repositório: https://github.com/Zayma1/erp-produtos-naturais-backend
- Branch: `novaVersao` (referência local `origin/novaVersao`).
- Commit: `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- Origem: `generated/sdk`, copiado integralmente com `git archive`, incluindo `.kubb`.
- Nenhum arquivo gerado foi editado. O SDK completo inclui operações fora do MVP; o proxy aceita apenas o catálogo.
- A URL padrão gerada aponta para Render, mas `components/providers.tsx` a substitui por uma base vazia antes de renderizar os consumidores. As URLs geradas já começam por `/api`, portanto não se deve configurar `baseURL: '/api'`, que duplicaria o prefixo.
- Referência remota `refs/heads/novaVersao` conferida com `git ls-remote` em 04/11/2026: permanece em `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.

Para atualizar, confira primeiro a branch remota e o contrato e substitua a pasta **inteira**, preservando arquivos ocultos. Mantenha validações, proxy e comportamento do frontend fora dos arquivos gerados.
