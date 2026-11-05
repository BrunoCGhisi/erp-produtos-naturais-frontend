# Lacunas do backend — Vila Verde

Registro para encaminhamento à equipe de backend. Inspeção em 05/11/2026 do commit fixado abaixo, sem mudanças no backend. “Confirmado por inspeção” comprova o código/contrato observado; não equivale a reprodução HTTP. Suspeitas e instalações externas são explicitadas por entrada.

IDs são permanentes. Ao resolver, manter a entrada e acrescentar commit de correção, teste e evidência; nenhuma entrada foi resolvida nesta etapa. Dependências continuam fora do escopo.

## Índice

| ID | Tipo | Assunto |
| --- | --- | --- |
| [BG-001](#bg-001) | Capacidade ausente | Funções de conclusão de estoque sem migração versionada |
| [BG-002](#bg-002) | Inconsistência de contrato | Detalhes de ajustes e transferências sem itens |
| [BG-003](#bg-003) | Capacidade ausente | Recebimento sem efeitos de estoque e progressão da compra |
| [BG-004](#bg-004) | Defeito | Edição de recebimento acrescenta itens |
| [BG-005](#bg-005) | Defeito | Exclusão de compra com itens viola FK |
| [BG-006](#bg-006) | Inconsistência de contrato | Status do pedido ignorado |
| [BG-007](#bg-007) | Inconsistência de contrato | PUT da compra recria IDs de itens |
| [BG-008](#bg-008) | Capacidade ausente | Vendas sem fechamento e baixa de estoque |
| [BG-009](#bg-009) | Defeito | Filtros individuais e combinados inconsistentes |
| [BG-010](#bg-010) | Inconsistência de contrato | Campos da entidade fornecedor ausentes dos DTOs |
| [BG-011](#bg-011) | Capacidade ausente | Autenticação e autorização de negócio ausentes |
| [BG-012](#bg-012) | Capacidade ausente | Precedência de preços sobrepostos indefinida |
| [BG-013](#bg-013) | Capacidade ausente | Listas sem paginação de servidor |
| [BG-014](#bg-014) | Inconsistência de contrato | Precisão e desconto não validados no DTO de compra |
| [BG-015](#bg-015) | Inconsistência de contrato | Cliente e operador opcionais no request, obrigatórios na entidade |
| [BG-016](#bg-016) | Inconsistência de contrato | Observação de venda não retorna na consulta |
| [BG-017](#bg-017) | Defeito | Atualização e exclusão de vendas sem guardas de status |
| [BG-018](#bg-018) | Inconsistência de contrato | Validação monetária e de precisão insuficiente nos itens de venda |
| [BG-019](#bg-019) | Inconsistência de contrato | Resposta de item omite total persistido e unidade histórica |
| [BG-020](#bg-020) | Defeito | Senha recebida atribuída diretamente a senhaHash |

<a id="bg-001"></a>
## BG-001 — Funções de conclusão de estoque sem migração versionada

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção; execução de conclusão não ensaiada.
- **Fonte:** [AjusteEstoqueService.concluir / TransferenciaEstoqueService.concluir](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/AjusteEstoqueService.java).
- **Comportamento observado:** Os serviços chamam public.fn_concluir_ajuste_estoque e public.fn_concluir_transferencia. Não há SQL/migração versionada em src/main/resources que instale essas funções.
- **Impacto/contorno no frontend:** Ajustes e transferências continuam sem escrita na interface.
- **Correção solicitada:** Versionar funções, permissões, instalação e atualização do esquema.
- **Aceite testável:** Um PostgreSQL vazio, preparado apenas pelo repositório, conclui ajuste e transferência, atualiza estoque uma única vez e desfaz tudo em erro.
- **Commit de correção:** pendente.

<a id="bg-002"></a>
## BG-002 — Detalhes de ajustes e transferências sem itens

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [AjusteResponseDTO.fromEntity / TransferenciaResponseDTO.fromEntity](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/ajuste/AjusteResponseDTO.java).
- **Comportamento observado:** Os DTOs de resposta contêm cabeçalho, sem coleção de itens. Os serviços gravam itens, mas buscar/listar não os incluem.
- **Impacto/contorno no frontend:** Não é possível construir revisão completa desses documentos; etapa mantém apenas visibilidade do estoque.
- **Correção solicitada:** Retornar itens com IDs, produto, tipo/quantidade e observação quando aplicáveis.
- **Aceite testável:** Criar documento com dois itens e recarregar seu detalhe retorna ambos com valores e IDs.
- **Commit de correção:** pendente.

<a id="bg-003"></a>
## BG-003 — Recebimento sem efeitos de estoque e progressão da compra

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado no serviço; efeitos de triggers externos permanecem suspeitos/não verificados.
- **Fonte:** [RecebimentoCompraService.criar / atualizar / salvarItens](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/RecebimentoCompraService.java).
- **Comportamento observado:** O serviço insere recebimentos/itens e muda somente o status do recebimento; não atualiza estoque, quantidadeRecebida dos itens de compra ou status da compra. Não foi identificada instalação versionada de triggers; instalações externas precisam de investigação separada.
- **Impacto/contorno no frontend:** Recebimento não é exposto; salvar rascunho é apresentado como operação sem efeito no estoque.
- **Correção solicitada:** Implementar transação de recebimento com controle de saldo recebido, progressão parcial/total e idempotência; documentar eventuais triggers existentes.
- **Aceite testável:** Receber parte e depois o restante incrementa estoque e quantidade recebida, progride a compra e não duplica efeitos em repetição/rollback.
- **Commit de correção:** pendente.

<a id="bg-004"></a>
## BG-004 — Edição de recebimento acrescenta itens

- **Tipo:** Defeito.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção; sem reprodução HTTP nesta etapa.
- **Fonte:** [RecebimentoCompraService.atualizar / salvarItens](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/RecebimentoCompraService.java).
- **Comportamento observado:** Atualizar chama salvarItens sem excluir/substituir itens anteriores; cada chamada cria novas entidades.
- **Impacto/contorno no frontend:** Não oferecer edição de recebimento nem simular substituição no frontend.
- **Correção solicitada:** Definir substituição completa ou atualização por ID e garantir integridade em transação.
- **Aceite testável:** PUT duas vezes com um item mantém exatamente um item com a quantidade informada, sem duplicatas.
- **Commit de correção:** pendente.

<a id="bg-005"></a>
## BG-005 — Exclusão de compra com itens viola FK

- **Tipo:** Defeito.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por reprodução em PostgreSQL 16 descartável.
- **Fonte:** [CompraService.excluir / ItemCompra.compra](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/CompraService.java).
- **Comportamento observado:** DELETE de rascunho com item retorna HTTP 409; log PostgreSQL confirma SQLState 23503 e FK de item_compra para compra. O serviço exclui apenas o cabeçalho e ItemCompra mantém FK sem cascata. scripts/purchases-seed.mjs reproduz por API upstream, verifica que a compra permanece e limpa seus itens somente por SQL de teste.
- **Impacto/contorno no frontend:** Não há exclusão de compras na interface/proxy. A limpeza de teste remove itens antes do cabeçalho; não existe contorno na aplicação.
- **Correção solicitada:** Excluir dependentes em transação para rascunhos sem referências externas, ou definir bloqueio de negócio explícito/documentado.
- **Aceite testável:** Rascunho com dois itens sem recebimentos pode ser excluído sem violar FK; nenhuma linha órfã permanece. Referências externas têm resposta de negócio e rollback integral.
- **Commit de correção:** pendente.

<a id="bg-006"></a>
## BG-006 — Status do pedido ignorado

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [CompraService.criar / atualizar / aplicar](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/CompraService.java).
- **Comportamento observado:** CompraRequestDTO expõe RASCUNHO, PARCIALMENTE_RECEBIDA, RECEBIDA e CANCELADA. Criar força RASCUNHO; aplicar ignora status; atualizar aceita apenas rascunhos.
- **Impacto/contorno no frontend:** POST/PUT enviam RASCUNHO; demais status são exibidos somente para consulta. Não há transições expostas.
- **Correção solicitada:** Restringir DTO de rascunho ou definir operações explícitas e regras de transição.
- **Aceite testável:** Contrato documenta os status aceitos em cada operação; status incompatível recebe 4xx, nunca sucesso silencioso ignorando a solicitação.
- **Commit de correção:** pendente.

<a id="bg-007"></a>
## BG-007 — PUT da compra recria IDs de itens

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e reprodução no banco descartável.
- **Fonte:** [CompraService.atualizar / salvarItens](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/CompraService.java).
- **Comportamento observado:** ItemCompraRequestDTO aceita id, mas atualizar exclui todos os itens e salvarItens cria novos IDs. A suíte real verifica a troca. FKs futuras de recebimento podem impedir editar mesmo um rascunho já referenciado.
- **Impacto/contorno no frontend:** PUT preserva IDs disponíveis por compatibilidade, sem assumir estabilidade após salvar; recarrega o detalhe autoritativo.
- **Correção solicitada:** Preservar identidade de itens existentes ou remover id do contrato e proibir explicitamente substituição com referências.
- **Aceite testável:** Um item mantido no PUT preserva ID e referências; item removido com referências produz erro de negócio claro e rollback completo.
- **Commit de correção:** pendente.

<a id="bg-008"></a>
## BG-008 — Vendas sem fechamento e baixa de estoque

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado no serviço; triggers externos não verificados.
- **Fonte:** [VendaService.aplicarCabecalho / criar / atualizar](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/VendaService.java).
- **Comportamento observado:** O serviço calcula valores e mantém venda ABERTA, sem operação de checkout, transições ou baixa de estoque.
- **Impacto/contorno no frontend:** Etapa 4 permite criar venda ABERTA e consultar registros em qualquer status, somente leitura após salvar. Não expõe checkout, edição, cancelamento, exclusão ou baixa. A suíte descartável confirma estoque inalterado na criação.
- **Correção solicitada:** Implementar fechamento/cancelamento transacionais com baixa/estorno e idempotência.
- **Aceite testável:** Fechar venda baixa estoque exatamente uma vez, bloqueia edição indevida e cancelamento segue política explícita com estorno testado.
- **Commit de correção:** pendente.

<a id="bg-009"></a>
## BG-009 — Filtros individuais e combinados inconsistentes

- **Tipo:** Defeito.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção; esta etapa não reproduziu todos os parâmetros por HTTP.
- **Fonte:** [MovimentacaoEstoqueService.listar / ProdutoSkuService.listar / ProdutoLojaService.listar / ProdutoPrecoLojaService.listar](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/MovimentacaoEstoqueService.java).
- **Comportamento observado:** Movimentações e preços filtram somente quando produto e loja são informados juntos; SKU ignora idLoja; vínculo prioriza produto e ignora loja quando ambos são informados. VendaService.listar prioriza cliente, depois usuário, depois loja, sem conjunção. [Fonte de vendas](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/VendaService.java), confirmado por inspeção; combinação de vendas não reproduzida por HTTP real.
- **Impacto/contorno no frontend:** Frontend filtra IDs localmente; SKU continua global por produto. Vendas envia cliente/loja à API e reaplica ambos localmente, além de status e intervalo inclusivo no fuso de São Paulo. Não introduzir regra de vínculo para comprar ou vender.
- **Correção solicitada:** Aplicar todos os filtros fornecidos por conjunção, ou retirar parâmetros sem significado do contrato.
- **Aceite testável:** Para cada recurso, testar nenhum filtro, cada filtro individual e ambos, inclusive combinação sem resultados. O retorno contém somente registros correspondentes.
- **Commit de correção:** pendente.

<a id="bg-010"></a>
## BG-010 — Campos da entidade fornecedor ausentes dos DTOs

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [FornecedorRequestDTO / FornecedorResponseDTO / Fornecedor](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/fornecedor/FornecedorRequestDTO.java).
- **Comportamento observado:** Entidade contém logradouro, numero, cep, email, telefone e status; DTOs não os recebem nem devolvem. Apenas complemento, CNPJ e CPF são opcionais no contrato atual.
- **Impacto/contorno no frontend:** Formulário usa somente nome fantasia, razão social, UF, cidade, bairro, complemento, CNPJ e CPF; sem contato/endereço completo/status.
- **Correção solicitada:** Decidir escopo e alinhar entidade, DTOs e documentação com validações apropriadas.
- **Aceite testável:** Cada campo público acordado pode ser gravado e lido sem perda; os demais estão documentados como internos ou removidos.
- **Commit de correção:** pendente.

<a id="bg-011"></a>
## BG-011 — Autenticação e autorização de negócio ausentes

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [SecurityConfig.securityFilterChain](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/config/SecurityConfig.java).
- **Comportamento observado:** Todas as requisições são permitAll; não há isolamento/autorização por usuário/loja.
- **Impacto/contorno no frontend:** Demonstração interna, sem seleção de usuário em criação e sem implantação pública nesta etapa.
- **Correção solicitada:** Definir autenticação, autorização por operação/loja e identidade auditável no servidor.
- **Aceite testável:** Sem credencial válida retorna 401; sem permissão retorna 403; cliente não consegue escolher identidade ou acessar loja indevida.
- **Commit de correção:** pendente.

<a id="bg-012"></a>
## BG-012 — Precedência de preços sobrepostos indefinida

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado como ausência de regra no serviço; decisão de produto pendente.
- **Fonte:** [ProdutoPrecoLojaService.listar / aplicar](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/ProdutoPrecoLojaService.java).
- **Comportamento observado:** Preços podem ter validades sobrepostas e não há regra explícita de desempate para preço vigente.
- **Impacto/contorno no frontend:** Catálogo exibe todos os preços/validades. Compras exigem custo informado e não reutilizam preço de venda.
- **Correção solicitada:** Definir política de sobreposição e seleção determinística de preço vigente.
- **Aceite testável:** Dois preços sobrepostos têm criação rejeitada ou seleção determinística documentada, testada nos limites de data.
- **Commit de correção:** pendente.

<a id="bg-013"></a>
## BG-013 — Listas sem paginação de servidor

- **Tipo:** Capacidade ausente.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [CompraService.listar / FornecedorService.listar e demais listar do catálogo](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/CompraService.java).
- **Comportamento observado:** Listas retornam arrays completos com findAll; compras incluem também todos os itens em cada resposta.
- **Impacto/contorno no frontend:** Filtros, ordenação e páginas de 20 registros são locais; volume crescente aumenta tráfego e memória.
- **Correção solicitada:** Adicionar paginação/filtros/ordenação estáveis, total e DTO resumido de compra para listagem.
- **Aceite testável:** Consultar páginas com ordem estável não duplica/perde registros; filtros afetam total e conteúdo; limite é aplicado no banco.
- **Commit de correção:** pendente.

<a id="bg-014"></a>
## BG-014 — Precisão e desconto não validados no DTO de compra

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção; efeitos de arredondamento/negativos suspeitos sem teste destrutivo nesta etapa.
- **Fonte:** [ItemCompraRequestDTO / ItemCompra / CompraService.salvarItens](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/compra/ItemCompraRequestDTO.java).
- **Comportamento observado:** DTO valida apenas mínimos; não limita casas/dígitos nem compara desconto ao bruto. Entidade usa numeric(14,3), numeric(14,4), numeric(14,2); serviço calcula total antes da persistência/arredondamento das colunas.
- **Impacto/contorno no frontend:** Validação local com inteiros escalados rejeita casas extras, limites e desconto acima do bruto sem arredondar. Outros clientes podem contornar isso.
- **Correção solicitada:** Adicionar validação de precisão e desconto no servidor antes de persistir, mantendo HALF_UP por item e limite da soma.
- **Aceite testável:** Casas/dígitos extras, desconto maior que bruto e soma fora do limite retornam 4xx sem gravação; limites válidos recarregam com totais iguais ao cálculo documentado.
- **Commit de correção:** pendente.

<a id="bg-015"></a>
## BG-015 — Cliente e operador opcionais no request, obrigatórios na entidade

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e probes descartáveis descritos abaixo (`scripts/sales-seed.mjs`).
- **Fonte:** [VendaRequestDTO](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/venda/VendaRequestDTO.java).
- **Comportamento observado:** Request permite IDs nulos e serviço os aplica; [Venda.cliente e usuario](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/entity/Venda.java) exige @NotNull. Envio sem ambos reproduziu HTTP 500 no banco descartável.
- **Impacto/contorno no frontend:** Form exige os dois IDs e seleção explícita de operador.
- **Correção solicitada:** Adicionar @NotNull aos IDs no DTO, mantendo contrato OpenAPI consistente.
- **Aceite testável:** Omitir cada ID individualmente retorna 400 com mensagem de campo; payload válido cria ABERTA.
- **Commit de correção:** pendente.

<a id="bg-016"></a>
## BG-016 — Observação de venda não retorna na consulta

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e probes descartáveis descritos abaixo (`scripts/sales-seed.mjs`).
- **Fonte:** [VendaResponseDTO.fromEntity](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/venda/VendaResponseDTO.java).
- **Comportamento observado:** Observação é aceita e gravada, mas não é devolvida. Probe enviou observação e confirmou sua ausência no POST/GET.
- **Impacto/contorno no frontend:** Sem input de observação e sem edição integral após salvar.
- **Correção solicitada:** Retornar observacao no DTO de resposta.
- **Aceite testável:** POST com observação seguido de GET preserva e retorna o texto.
- **Commit de correção:** pendente.

<a id="bg-017"></a>
## BG-017 — Atualização e exclusão de vendas sem guardas de status

- **Tipo:** Defeito.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e probes descartáveis descritos abaixo (`scripts/sales-seed.mjs`).
- **Fonte:** [VendaService.atualizar / excluir](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/VendaService.java).
- **Comportamento observado:** Serviço não verifica status. Probe alterou status para CONCLUIDA por SQL exclusivo de teste: PUT e DELETE upstream foram aceitos (200/204).
- **Impacto/contorno no frontend:** Proxy bloqueia PUT/DELETE de vendas; detalhe sempre somente leitura.
- **Correção solicitada:** Definir política de imutabilidade por status e validá-la em transação.
- **Aceite testável:** PUT/DELETE de venda concluída/cancelada são rejeitados com erro de negócio, sem modificar itens/cabeçalho.
- **Commit de correção:** pendente.

<a id="bg-018"></a>
## BG-018 — Validação monetária e de precisão insuficiente nos itens de venda

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e probes descartáveis descritos abaixo (`scripts/sales-seed.mjs`).
- **Fonte:** [ProdutoVendaRequestDTO / ProdutoVenda](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/venda/ProdutoVendaRequestDTO.java).
- **Comportamento observado:** DTO só impõe mínimo de quantidade e presença de preço. Não há mínimo de preço/desconto, @Digits ou comparação desconto/bruto. Probe com preço -1 foi aceito e retornou total -1. Precisão excessiva e outros valores inválidos não foram reproduzidos por HTTP.
- **Impacto/contorno no frontend:** BigInt em escalas 3/2/2, limites numeric(14,3), numeric(12,2), numeric(14,2), desconto limitado ao bruto não arredondado; HALF_UP agregado.
- **Correção solicitada:** Validar escalas, limites, mínimos e desconto <= bruto também no backend.
- **Aceite testável:** Valores negativos, escala excedida, overflow e desconto acima do bruto retornam 400 e não persistem; limites válidos têm totais consistentes.
- **Commit de correção:** pendente.

<a id="bg-019"></a>
## BG-019 — Resposta de item omite total persistido e unidade histórica

- **Tipo:** Inconsistência de contrato.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção e probes descartáveis descritos abaixo (`scripts/sales-seed.mjs`).
- **Fonte:** [ProdutoVendaResponseDTO.fromEntity](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/dto/venda/ProdutoVendaResponseDTO.java).
- **Comportamento observado:** [ProdutoVenda](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/entity/ProdutoVenda.java) persiste totalItem e unidadeSiglaSnapshot, DTO omite ambos. Ausência confirmada no retorno real.
- **Impacto/contorno no frontend:** Detalhe usa totais de cabeçalho autoritativos e identifica unidade atual como lookup do catálogo. Não apresenta cálculo como total persistido do item.
- **Correção solicitada:** Incluir totalItem e unidadeSiglaSnapshot nas respostas.
- **Aceite testável:** GET devolve total HALF_UP e unidade histórica mesmo após mudar a unidade do catálogo.
- **Commit de correção:** pendente.

<a id="bg-020"></a>
## BG-020 — Senha recebida atribuída diretamente a senhaHash

- **Tipo:** Defeito.
- **Commit inspecionado:** `e0f312e611d56ab73a4a8e3d5832f8b8874ff362`.
- **Situação:** Confirmado por inspeção.
- **Fonte:** [UsuarioService.criar / atualizar](https://github.com/Zayma1/erp-produtos-naturais-backend/blob/e0f312e611d56ab73a4a8e3d5832f8b8874ff362/src/main/java/com/vilaverde/erp/service/UsuarioService.java).
- **Comportamento observado:** Ambos os métodos chamam setSenhaHash(dto.senha()), sem hashing no serviço inspecionado. Confirmado por inspeção; conteúdo de senha persistida não foi consultado nem registrado.
- **Impacto/contorno no frontend:** Sem gestão de usuários ou autenticação. Operador descartável é criado somente por teste upstream com segredo aleatório.
- **Correção solicitada:** Aplicar hash de senha adequado e política consistente de criação/atualização, com tratamento seguro de credenciais.
- **Aceite testável:** Teste de serviço comprova hash verificável diferente da senha recebida; resposta/log não expõe senha nem hash.
- **Commit de correção:** pendente.
