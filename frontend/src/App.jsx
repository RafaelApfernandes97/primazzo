import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Login from './Login'

const API_URL = '/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [contatos, setContatos] = useState([])
  const [contatoSelecionado, setContatoSelecionado] = useState(null)
  const [atendimentos, setAtendimentos] = useState([])
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [protocoloSearch, setProtocoloSearch] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estados do calendário
  const [calendarioAberto, setCalendarioAberto] = useState(false)
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [dataInicioTemp, setDataInicioTemp] = useState(null)
  const [dataFimTemp, setDataFimTemp] = useState(null)

  // Verificar autenticação ao carregar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  // Carregar contatos quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      carregarContatos()
    }
  }, [isAuthenticated])

  // Carregar contatos com busca
  useEffect(() => {
    if (!isAuthenticated) return

    const timer = setTimeout(() => {
      carregarContatos()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, isAuthenticated])

  // Recarregar atendimentos quando os filtros mudarem
  useEffect(() => {
    if (!isAuthenticated || !contatoSelecionado) return

    const timer = setTimeout(() => {
      carregarAtendimentos(contatoSelecionado)
    }, 500)

    return () => clearTimeout(timer)
  }, [protocoloSearch, dataInicio, dataFim, isAuthenticated])

  const handleLogin = (token) => {
    setIsAuthenticated(true)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setIsAuthenticated(false)
  }

  // Se não autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const carregarContatos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/contatos`, {
        params: { search: searchTerm, limit: 100 }
      })
      setContatos(response.data.data)
    } catch (err) {
      setError('Erro ao carregar contatos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const carregarAtendimentos = async (contato) => {
    if (!contato) return

    try {
      setLoading(true)
      setError(null)

      const params = { limit: 50 }
      if (protocoloSearch) params.protocolo = protocoloSearch
      if (dataInicio) params.dataInicio = dataInicio
      if (dataFim) params.dataFim = dataFim

      const url = `${API_URL}/contatos/${encodeURIComponent(contato.id)}/atendimentos`
      console.log('📅 [FILTRO] Requisitando atendimentos')
      console.log('   URL:', url)
      console.log('   Protocolo:', protocoloSearch || 'não filtrado')
      console.log('   Data Início:', dataInicio ? formatarDataExibicao(dataInicio) : 'não filtrada')
      console.log('   Data Fim:', dataFim ? formatarDataExibicao(dataFim) : 'não filtrada')

      const response = await axios.get(url, { params })
      console.log('✅ [FILTRO] Atendimentos encontrados:', response.data.data.length)

      setAtendimentos(response.data.data)
    } catch (err) {
      setError('Erro ao carregar atendimentos')
      console.error('❌ [FILTRO] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const selecionarContato = async (contato) => {
    console.log('Selecionando contato:', contato)
    setContatoSelecionado(contato)
    setAtendimentoSelecionado(null)
    setMensagens([])
    setProtocoloSearch('')
    setDataInicio('')
    setDataFim('')
    await carregarAtendimentos(contato)
  }

  const selecionarAtendimento = async (atendimento) => {
    try {
      console.log('Selecionando atendimento:', atendimento)
      setAtendimentoSelecionado(atendimento)
      setLoading(true)

      // Support both string id and _id (some pipelines may return id or _id)
      const atendimentoId = (atendimento._id && (atendimento._id.$oid || atendimento._id)) || atendimento.id || atendimento._id
      console.log('atendimentoId usado na URL:', atendimentoId)
      const url = `${API_URL}/atendimentos/${encodeURIComponent(atendimentoId)}/mensagens`
      console.log('Requisitando mensagens URL:', url)
      const response = await axios.get(url, { params: { limit: 500 } })
      console.log('Resposta mensagens:', response.data && response.data.data ? `count=${response.data.data.length}` : response.data)
      setMensagens(response.data.data || [])
    } catch (err) {
      setError('Erro ao carregar mensagens')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data) => {
    if (!data) return ''
    const date = new Date(data)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatarTelefone = (telefone) => {
    if (!telefone) return ''
    const cleaned = telefone.replace(/\D/g, '')
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }
    return telefone
  }

  // Funções do calendário
  const obterNomeMes = (mes) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return meses[mes]
  }

  const obterDiasDoMes = (mes, ano) => {
    const primeiroDia = new Date(ano, mes, 1).getDay()
    const ultimoDia = new Date(ano, mes + 1, 0).getDate()
    const diasMesAnterior = new Date(ano, mes, 0).getDate()

    const dias = []

    // Dias do mês anterior
    for (let i = primeiroDia - 1; i >= 0; i--) {
      dias.push({ dia: diasMesAnterior - i, mesAtual: false })
    }

    // Dias do mês atual
    for (let i = 1; i <= ultimoDia; i++) {
      dias.push({ dia: i, mesAtual: true })
    }

    // Dias do próximo mês para completar a grid
    const diasRestantes = 42 - dias.length
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push({ dia: i, mesAtual: false })
    }

    return dias
  }

  const formatarDataParaAPI = (data) => {
    if (!data) return ''
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  const formatarDataExibicao = (dataStr) => {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const verificarDataNoIntervalo = (dia) => {
    if (!dataInicioTemp) return false

    const dataAtual = new Date(anoSelecionado, mesSelecionado, dia)

    if (!dataFimTemp) {
      return dataAtual.getTime() === dataInicioTemp.getTime()
    }

    return dataAtual >= dataInicioTemp && dataAtual <= dataFimTemp
  }

  const selecionarDia = (dia) => {
    const dataSelecionada = new Date(anoSelecionado, mesSelecionado, dia)

    if (!dataInicioTemp || (dataInicioTemp && dataFimTemp)) {
      // Primeira seleção ou resetar seleção
      setDataInicioTemp(dataSelecionada)
      setDataFimTemp(null)
    } else {
      // Segunda seleção
      if (dataSelecionada < dataInicioTemp) {
        setDataFimTemp(dataInicioTemp)
        setDataInicioTemp(dataSelecionada)
      } else {
        setDataFimTemp(dataSelecionada)
      }

      // Aplicar filtro
      const inicio = dataSelecionada < dataInicioTemp ? dataSelecionada : dataInicioTemp
      const fim = dataSelecionada < dataInicioTemp ? dataInicioTemp : dataSelecionada

      setDataInicio(formatarDataParaAPI(inicio))
      setDataFim(formatarDataParaAPI(fim))

      // Fechar calendário automaticamente após selecionar intervalo completo
      setTimeout(() => {
        setCalendarioAberto(false)
      }, 300)
    }
  }

  const limparFiltroData = () => {
    setDataInicio('')
    setDataFim('')
    setDataInicioTemp(null)
    setDataFimTemp(null)
    // Resetar calendário para mês/ano atual
    setMesSelecionado(new Date().getMonth())
    setAnoSelecionado(new Date().getFullYear())
  }

  // Renderiza diferentes formatos de conteúdo de mensagem (string, objeto, array)
  const renderMessageContent = (mensagem) => {
    const msgText = mensagem.mensagem || mensagem.texto || mensagem.message || mensagem.objeto || ''

    if (msgText == null) return ''

    // Se for string, retorna diretamente
    if (typeof msgText === 'string') return msgText

    // Se for array, juntamos itens (assume que cada item é string ou possui texto)
    if (Array.isArray(msgText)) {
      return msgText.map((m, i) => (typeof m === 'string' ? m : JSON.stringify(m))).join(' ')
    }

    // Se for objeto, trate formatos conhecidos (ex: { titulo, opcoes })
    if (typeof msgText === 'object') {
      // Caso comum: botões/opções
      if (msgText.titulo || msgText.titulo === '') {
        const titulo = msgText.titulo || ''
        const opcoes = Array.isArray(msgText.opcoes) ? msgText.opcoes : []
        return (
          <div>
            {titulo && <div className="mensagem-card-titulo">{titulo}</div>}
            {opcoes.length > 0 && (
              <ul className="mensagem-card-opcoes">
                {opcoes.map((op, idx) => (
                  <li key={idx}>{typeof op === 'string' ? op : JSON.stringify(op)}</li>
                ))}
              </ul>
            )}
          </div>
        )
      }

      // Fallback: stringify
      try {
        return JSON.stringify(msgText)
      } catch (e) {
        return String(msgText)
      }
    }

    // Fallback para outros tipos
    return String(msgText)
  }

  // Função auxiliar para obter extensão do arquivo
  const getFileExtension = (filename) => {
    if (!filename) return ''
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }

  // Função auxiliar para detectar tipo de arquivo
  const detectFileType = (arquivo) => {
    if (!arquivo) return 'unknown'

    const mime = arquivo.tipo || ''
    const extension = getFileExtension(arquivo.nome)

    // Detectar imagens
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return 'image'
    }

    // Detectar áudio
    if (mime.startsWith('audio/') || ['mp3', 'ogg', 'wav', 'mpeg', 'm4a', 'aac', 'opus'].includes(extension)) {
      return 'audio'
    }

    // Detectar vídeo
    if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'].includes(extension)) {
      return 'video'
    }

    // Detectar documentos PDF
    if (mime.includes('pdf') || extension === 'pdf') {
      return 'pdf'
    }

    // Detectar planilhas
    if (mime.includes('spreadsheet') || ['xlsx', 'xls', 'csv', 'ods'].includes(extension)) {
      return 'spreadsheet'
    }

    // Detectar documentos
    if (mime.includes('document') || mime.includes('word') || ['doc', 'docx', 'odt', 'txt'].includes(extension)) {
      return 'document'
    }

    // Detectar arquivos compactados
    if (mime.includes('zip') || mime.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive'
    }

    return 'other'
  }

  // Função para obter ícone do arquivo
  const getFileIcon = (type) => {
    const icons = {
      pdf: '📄',
      spreadsheet: '📊',
      document: '📝',
      archive: '🗜️',
      other: '📎'
    }
    return icons[type] || '📎'
  }

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Render a file preview or download link based on arquivo metadata
  const renderFile = (arquivo) => {
    if (!arquivo || !arquivo.url) return null

    const fileType = detectFileType(arquivo)
    const fileSize = formatFileSize(arquivo.size)

    // Renderizar imagens
    if (fileType === 'image') {
      return (
        <div className="media-container">
          <img
            src={arquivo.url}
            alt={arquivo.nome}
            className="media-image"
            loading="lazy"
          />
          <div className="media-caption">
            <span>{arquivo.nome}</span>
            <a href={arquivo.url} download={arquivo.nome} className="btn-download" title="Baixar imagem">
              ⬇️
            </a>
          </div>
        </div>
      )
    }

    // Renderizar áudio
    if (fileType === 'audio') {
      return (
        <div className="media-container">
          <div className="audio-player">
            <div className="audio-info">
              <span className="audio-icon">🎵</span>
              <div className="audio-details">
                <div className="audio-name">{arquivo.nome}</div>
                {fileSize && <div className="audio-size">{fileSize}</div>}
              </div>
              <a href={arquivo.url} download={arquivo.nome} className="btn-download" title="Baixar áudio">
                ⬇️
              </a>
            </div>
            <audio controls src={arquivo.url} className="audio-element">
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
        </div>
      )
    }

    // Renderizar vídeo
    if (fileType === 'video') {
      return (
        <div className="media-container">
          <video controls src={arquivo.url} className="media-video">
            Seu navegador não suporta o elemento de vídeo.
          </video>
          <div className="media-caption">
            <span>{arquivo.nome}</span>
            <a href={arquivo.url} download={arquivo.nome} className="btn-download" title="Baixar vídeo">
              ⬇️
            </a>
          </div>
        </div>
      )
    }

    // Renderizar botão de download para outros arquivos
    const icon = getFileIcon(fileType)
    return (
      <div className="media-container">
        <a href={arquivo.url} download={arquivo.nome} className="file-download">
          <div className="file-icon">{icon}</div>
          <div className="file-info">
            <div className="file-name">{arquivo.nome}</div>
            {fileSize && <div className="file-size">{fileSize}</div>}
          </div>
          <div className="download-icon">⬇️</div>
        </a>
      </div>
    )
  }

  const obterStatusTexto = (status) => {
    const statusMap = {
      'F': 'Finalizado',
      'A': 'Ativo',
      'E': 'Em espera',
      'T': 'Transferido'
    }
    return statusMap[status] || status
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Mais Chat - Viewer</h1>
            <p>Visualizador de Atendimentos</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <div className="app-container">
        {/* Lista de Contatos */}
        <div className="panel contatos-panel">
          <div className="panel-header">
            <h2>Contatos</h2>
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="panel-content">
            {loading && !contatoSelecionado && (
              <div className="loading-container">
                <div className="loading"></div>
                <p>Carregando contatos...</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && contatos.length === 0 && (
              <div className="empty-message">
                Nenhum contato encontrado
              </div>
            )}

            <div className="list">
              {contatos.map((contato) => (
                <div
                  key={contato.id}
                  className={`list-item ${contatoSelecionado?.id === contato.id ? 'active' : ''}`}
                  onClick={() => selecionarContato(contato)}
                >
                  <div className="list-item-avatar">
                    <span>{contato.nome ? contato.nome[0].toUpperCase() : '?'}</span>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {contato.nome || 'Sem nome'}
                    </div>
                    <div className="list-item-subtitle">
                      {formatarTelefone(contato.telefone)}
                    </div>
                  </div>
                  <div className="list-item-meta">
                    <div className="badge">{contato.totalAtendimentos}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Atendimentos */}
        <div className="panel atendimentos-panel">
          <div className="panel-header">
            <h2>Atendimentos</h2>
            {contatoSelecionado && (
              <div className="panel-subtitle">
                {contatoSelecionado.nome || 'Sem nome'} - {formatarTelefone(contatoSelecionado.telefone)}
              </div>
            )}

            {contatoSelecionado && (
              <div className="filtros-atendimentos">
                <div className="barra-busca-filtros">
                  <input
                    type="text"
                    placeholder="Buscar por protocolo..."
                    value={protocoloSearch}
                    onChange={(e) => setProtocoloSearch(e.target.value)}
                    className="search-input-inline"
                  />
                  <button
                    className={`btn-calendario ${calendarioAberto ? 'active' : ''}`}
                    onClick={() => setCalendarioAberto(!calendarioAberto)}
                    title="Filtrar por data"
                  >
                    📅
                  </button>
                </div>

                {/* Exibir filtro de data aplicado */}
                {(dataInicio || dataFim) && (
                  <div className="filtro-aplicado">
                    <span>
                      {dataInicio && dataFim ? (
                        <>De {formatarDataExibicao(dataInicio)} até {formatarDataExibicao(dataFim)}</>
                      ) : dataInicio ? (
                        <>A partir de {formatarDataExibicao(dataInicio)}</>
                      ) : (
                        <>Até {formatarDataExibicao(dataFim)}</>
                      )}
                    </span>
                    <button className="btn-limpar-filtro" onClick={limparFiltroData}>
                      ✕
                    </button>
                  </div>
                )}

                {/* Calendário expansível */}
                {calendarioAberto && (
                  <div className="calendario-container">
                    <div className="calendario-header">
                      <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
                        className="calendario-select"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            {obterNomeMes(i)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                        className="calendario-select"
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const ano = new Date().getFullYear() - 5 + i
                          return (
                            <option key={ano} value={ano}>
                              {ano}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className="calendario-dias-semana">
                      <div>Dom</div>
                      <div>Seg</div>
                      <div>Ter</div>
                      <div>Qua</div>
                      <div>Qui</div>
                      <div>Sex</div>
                      <div>Sáb</div>
                    </div>

                    <div className="calendario-grid">
                      {obterDiasDoMes(mesSelecionado, anoSelecionado).map((item, index) => (
                        <div
                          key={index}
                          className={`calendario-dia ${!item.mesAtual ? 'outro-mes' : ''} ${
                            item.mesAtual && verificarDataNoIntervalo(item.dia) ? 'selecionado' : ''
                          }`}
                          onClick={() => item.mesAtual && selecionarDia(item.dia)}
                        >
                          {item.dia}
                        </div>
                      ))}
                    </div>

                    <div className="calendario-footer">
                      <button
                        className="btn-calendario-acao"
                        onClick={() => {
                          limparFiltroData()
                          setCalendarioAberto(false)
                        }}
                      >
                        Limpar
                      </button>
                      <button
                        className="btn-calendario-acao primary"
                        onClick={() => setCalendarioAberto(false)}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel-content">
            {!contatoSelecionado && (
              <div className="empty-message">
                Selecione um contato para ver os atendimentos
              </div>
            )}

            {loading && contatoSelecionado && !atendimentoSelecionado && (
              <div className="loading-container">
                <div className="loading"></div>
                <p>Carregando atendimentos...</p>
              </div>
            )}

            {contatoSelecionado && !loading && atendimentos.length === 0 && (
              <div className="empty-message">
                Nenhum atendimento encontrado
              </div>
            )}

            <div className="list">
              {atendimentos.map((atendimento) => (
                <div
                  key={atendimento._id}
                  className={`list-item ${atendimentoSelecionado?._id === atendimento._id ? 'active' : ''}`}
                  onClick={() => selecionarAtendimento(atendimento)}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">
                      Protocolo: {atendimento.protocolo}
                    </div>
                    <div className="list-item-subtitle">
                      {formatarData(atendimento.date)}
                    </div>
                    {atendimento.fim && (
                      <div className="list-item-subtitle">
                        Fim: {formatarData(atendimento.fim)}
                      </div>
                    )}
                  </div>
                  <div className="list-item-meta">
                    <div className={`status-badge status-${atendimento.status}`}>
                      {obterStatusTexto(atendimento.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mensagens do Atendimento */}
        <div className="panel mensagens-panel">
          <div className="panel-header">
            <h2>Mensagens</h2>
            {atendimentoSelecionado && (
              <div className="panel-subtitle">
                Protocolo: {atendimentoSelecionado.protocolo}
              </div>
            )}
          </div>

          <div className="panel-content">
            {!atendimentoSelecionado && (
              <div className="empty-message">
                Selecione um atendimento para ver as mensagens
              </div>
            )}

            {loading && atendimentoSelecionado && (
              <div className="loading-container">
                <div className="loading"></div>
                <p>Carregando mensagens...</p>
              </div>
            )}

            {atendimentoSelecionado && !loading && mensagens.length === 0 && (
              <div className="empty-message">
                Nenhuma mensagem encontrada
              </div>
            )}

            <div className="mensagens-list">
              {mensagens.map((mensagem) => {
                const msgDate = mensagem.data || mensagem.createdAt || mensagem.date
                const msgId = mensagem._id || mensagem.id || JSON.stringify(mensagem)
                const isUser = !!mensagem.atendenteNome // messages with atendenteNome are from attendant
                return (
                  <div key={msgId} className={`mensagem ${isUser ? 'user' : 'contact'}`}>
                    <div className="mensagem-content">
                      {mensagem.atendenteNome && (
                        <div className="mensagem-atendente">{mensagem.atendenteNome}</div>
                      )}
                      {mensagem.tipo === 'midia' && mensagem.arquivo ? (
                        renderFile(mensagem.arquivo)
                      ) : (
                        renderMessageContent(mensagem)
                      )}
                    </div>
                    <div className="mensagem-meta">
                      {formatarData(msgDate)}
                      {mensagem.statusEnvio && (
                        <span className="mensagem-status">
                          {' • '}{mensagem.statusEnvio.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
