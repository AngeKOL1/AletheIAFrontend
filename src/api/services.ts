import { api } from './client';
import type {
  Categoria,
  EstadoParticipante,
  Fase,
  ItemCuestionario,
  LoginRequest,
  LoginResponse,
  NoticiaFeed,
  PrediccionManualRequest,
  PrediccionManualResponse,
  RegisterRequest,
  RegisterResponse,
  RespuestasLoteRequest,
  SesionTest,
} from '../types/api';

export const authApi = {
  register: (body: RegisterRequest) =>
    api.post<RegisterResponse>('/api/auth/register', body).then((r) => r.data),
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', body).then((r) => r.data),
};

export const participanteApi = {
  estado: (fase: Fase) =>
    api
      .get<EstadoParticipante>('/api/participantes/me/estado', { params: { fase } })
      .then((r) => r.data),
};

export const categoriasApi = {
  listar: () => api.get<Categoria[]>('/api/categorias').then((r) => r.data),
};

export const noticiasApi = {
  /** La forma (A/B) la infiere el backend a partir del JWT. */
  feed: () => api.get<NoticiaFeed[]>('/api/noticias/feed').then((r) => r.data),
};

export const prediccionesApi = {
  registrar: (body: PrediccionManualRequest) =>
    api.post<PrediccionManualResponse>('/api/predicciones-manuales', body).then((r) => r.data),
  misIdsRespondidos: (fase: Fase) =>
    api
      .get<number[]>('/api/predicciones-manuales/mis-ids-respondidos', { params: { fase } })
      .then((r) => r.data),
  miProgreso: (fase: Fase) =>
    api
      .get<number>('/api/predicciones-manuales/mi-progreso', { params: { fase } })
      .then((r) => r.data),
};

export const cuestionarioApi = {
  items: () => api.get<ItemCuestionario[]>('/api/items-cuestionario').then((r) => r.data),
  /** Idempotente: devuelve la sesión abierta si existe; 409 si ya fue finalizada. */
  iniciarSesion: (fase: Fase, titulo: string) =>
    api
      .post<SesionTest>('/api/sesiones-test/iniciar', null, { params: { fase, titulo } })
      .then((r) => r.data),
  enviarLote: (body: RespuestasLoteRequest) =>
    api.post<void>('/api/respuestas-cuestionario/lote', body).then(() => undefined),
  finalizarSesion: (id: number) =>
    api.put<SesionTest>(`/api/sesiones-test/${id}/finalizar`).then((r) => r.data),
};
