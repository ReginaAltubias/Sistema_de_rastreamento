# Sistema de Rastreabilidade por Lote

## Visão Geral

O sistema implementa um fluxo completo de rastreabilidade por lote para exportação, permitindo que exportadores agreguem múltiplos produtores em um único lote rastreável.

## Fluxo de Funcionamento

### 1. Criação do Lote (`/batch/create`)
- Exportador acessa o formulário de criação
- Seleciona produtores cadastrados (multi-seleção)
- Define produto (café, cacau, madeira) e quantidade total
- Sistema gera automaticamente:
  - **Código principal**: `LOTE-2025-XXXXXX`
  - **Subcódigos por produtor**: `XXXXXX-A`, `XXXXXX-B`, etc.

### 2. Emissão de Códigos
- Código principal identifica o lote completo
- Subcódigos permitem rastreabilidade individual de cada produtor
- QR Code gerado automaticamente para acesso público

### 3. Selagem Digital (`/batch/:id`)
- Operador autorizado pode selar o lote
- Registro de quem selou e quando
- Status muda para "Selado" garantindo integridade

### 4. Pontos de Controle
Durante o transporte, o sistema registra:
- **Localização GPS** automática
- **Data e hora** do checkpoint
- **Operador responsável** (login obrigatório)
- **Tipo de transporte**: 🚚 Camião, 🚢 Navio, ✈️ Avião
- **Status personalizado** (Em trânsito, Armazém, Porto, etc.)

### 5. Portal Público (`/public/batch/:id`)
Qualquer pessoa pode consultar:
- ✅ Origem do lote e informações básicas
- ✅ Lista completa de produtores agregados
- ✅ Registro de selagem (se aplicável)
- ✅ Linha do tempo com todos os checkpoints
- ✅ Mapa de rastreamento em tempo real
- ✅ Transparência total sem necessidade de login

## Estrutura de Dados

### Lote (Batch)
```javascript
{
  id: "timestamp",
  batchCode: "LOTE-2025-123456",
  name: "Lote Café Premium Janeiro 2025",
  product: "Café",
  totalQuantity: 20.5,
  producers: [
    {
      id: "producer_id",
      name: "João Silva",
      location: "Fazenda São José",
      quantity: 5.2,
      subCode: "123456-A"
    }
  ],
  createdAt: "2025-01-XX",
  status: "Criado|Selado|Em trânsito|Entregue",
  sealed: true,
  sealedBy: "Operador Nome",
  sealedAt: "2025-01-XX",
  checkpoints: [...]
}
```

### Produtor (Producer)
```javascript
{
  id: "timestamp",
  name: "Nome do Produtor",
  location: "Localização/Fazenda",
  quantity: 5.5
}
```

## Páginas Implementadas

| Rota | Componente | Descrição | Acesso |
|------|------------|-----------|---------|
| `/batches` | `BatchList` | Lista todos os lotes com filtros | Privado |
| `/batch/create` | `BatchForm` | Criação de novos lotes | Privado |
| `/batch/:id` | `BatchTracking` | Gestão e rastreamento do lote | Privado |
| `/public/batch/:id` | `PublicBatch` | Consulta pública transparente | Público |

## Funcionalidades Principais

### 🔐 Controle de Acesso
- **Páginas privadas**: Requerem login para operações
- **Portal público**: Acesso livre para consulta
- **Selagem**: Apenas usuários logados podem selar lotes

### 📱 QR Code
- Gerado automaticamente para cada lote
- Aponta para URL pública: `/public/batch/:id`
- Pode ser impresso e colado na embalagem física

### 🗺️ Rastreamento Geográfico
- GPS automático nos checkpoints
- Mapa interativo com marcadores
- Geocodificação reversa para nomes de locais

### 📊 Estatísticas
- Total de lotes criados
- Lotes selados vs não selados
- Volume total em toneladas
- Lotes em trânsito

### 🔍 Busca e Filtros
- Busca por nome, código ou produto
- Filtro por status (Criado, Selado, Em trânsito, Entregue)
- Ordenação por data de criação

## Benefícios

1. **Transparência**: Portal público permite verificação por qualquer interessado
2. **Rastreabilidade**: Cada produtor mantém identidade dentro do lote
3. **Integridade**: Sistema de selagem digital
4. **Eficiência**: Agregação de múltiplos produtores em um único processo
5. **Auditabilidade**: Registro completo de toda a cadeia logística

## Tecnologias Utilizadas

- **React** + **React Router** para interface
- **Leaflet** + **React-Leaflet** para mapas
- **QRCode.react** para geração de QR codes
- **Lucide React** para ícones
- **Tailwind CSS** para estilização
- **LocalStorage** para persistência (demo)

## Próximos Passos

- [ ] Integração com backend real
- [ ] Autenticação robusta
- [ ] Notificações em tempo real
- [ ] Relatórios em PDF
- [ ] API pública para integrações
- [ ] App mobile para leitura de QR codes