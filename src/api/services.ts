import { api, recibir } from './client';
import {
  categoriaEsquema,
  conteoEsquema,
  estadoParticipanteEsquema,
  itemCuestionarioEsquema,
  listaIdsEsquema,
  loginResponseEsquema,
  noticiaFeedEsquema,
  sesionTestEsquema,
} from './esquemas';
import { z } from 'zod';
import type {
  Categoria,
  EstadoParticipante,
  Fase,
  ItemCuestionario,
  LoginRequest,
  LoginResponse,
  NoticiaFeed,
  PrediccionManualRequest,
  RegisterRequest,
  RespuestasLoteRequest,
  SesionTest,
} from '../types/api';

/*
 * Cada método valida la respuesta con su esquema (ver `esquemas.ts`).
 * Las operaciones cuya respuesta la app no usa devuelven `void`, para no
 * declarar una forma de datos que nunca se lee ni se comprueba.
 */

const sinCuerpo = () => undefined;

export const authApi = {
  register: (body: RegisterRequest): Promise<void> =>
    api.post('/api/auth/register', body).then(sinCuerpo),
  login: (body: LoginRequest): Promise<LoginResponse> =>
    api.post('/api/auth/login', body).then(recibir(loginResponseEsquema)),
};

export const participanteApi = {
  estado: (fase: Fase): Promise<EstadoParticipante> =>
    api
      .get('/api/participantes/me/estado', { params: { fase } })
      .then(recibir(estadoParticipanteEsquema)),
};

export const categoriasApi = {
  listar: (): Promise<Categoria[]> =>
    api.get('/api/categorias').then(recibir(z.array(categoriaEsquema))),
};

export const noticiasApi = {
  /** La forma (A/B) la infiere el backend a partir del JWT. */
  feed: (): Promise<NoticiaFeed[]> =>
    api.get('/api/noticias/feed').then(recibir(z.array(noticiaFeedEsquema))),
};

export const prediccionesApi = {
  registrar: (body: PrediccionManualRequest): Promise<void> =>
    api.post('/api/predicciones-manuales', body).then(sinCuerpo),
  misIdsRespondidos: (fase: Fase): Promise<number[]> =>
    api
      .get('/api/predicciones-manuales/mis-ids-respondidos', { params: { fase } })
      .then(recibir(listaIdsEsquema)),
  miProgreso: (fase: Fase): Promise<number> =>
    api
      .get('/api/predicciones-manuales/mi-progreso', { params: { fase } })
      .then(recibir(conteoEsquema)),
};

export const cuestionarioApi = {
  items: (): Promise<ItemCuestionario[]> =>
    api.get('/api/items-cuestionario').then(recibir(z.array(itemCuestionarioEsquema))),
  /** Idempotente: devuelve la sesión abierta si existe; 409 si ya fue finalizada. */
  iniciarSesion: (fase: Fase, titulo: string): Promise<SesionTest> =>
    api
      .post('/api/sesiones-test/iniciar', undefined, { params: { fase, titulo } })
      .then(recibir(sesionTestEsquema)),
  enviarLote: (body: RespuestasLoteRequest): Promise<void> =>
    api.post('/api/respuestas-cuestionario/lote', body).then(sinCuerpo),
  finalizarSesion: (id: number): Promise<void> =>
    api.put(`/api/sesiones-test/${id}/finalizar`).then(sinCuerpo),
};
