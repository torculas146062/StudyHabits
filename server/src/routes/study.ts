import { Request, Response, Router } from 'express';

import { currentUserId, requireAuth } from '../auth/requireAuth';
import { IStudyRepository } from '../repositories/IStudyRepository';

/** Comfortably above a real plan, small enough to keep JSON parsing cheap. */
const MAX_PLAN_BYTES = 512 * 1024;

type ParsedSave = {
  data: Record<string, unknown>;
  baseRevision: number;
};

function parseSave(body: unknown): ParsedSave | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const { data, baseRevision } = body as Record<string, unknown>;

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return null;
  }

  const revision = baseRevision ?? 0;

  if (
    typeof revision !== 'number' ||
    !Number.isInteger(revision) ||
    revision < 0
  ) {
    return null;
  }

  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_PLAN_BYTES) {
    return null;
  }

  return { data: data as Record<string, unknown>, baseRevision: revision };
}

export function createStudyRouter(studyRepository: IStudyRepository): Router {
  const router = Router();

  router.use(requireAuth);

  router.get('/', async (_req: Request, res: Response) => {
    const plan = await studyRepository.get(currentUserId(res));

    res.json(plan ?? { data: null, revision: 0, updatedAt: null });
  });

  router.put('/', async (req: Request, res: Response) => {
    const parsed = parseSave(req.body);

    if (!parsed) {
      res.status(400).json({ error: 'Invalid study plan payload.' });
      return;
    }

    const result = await studyRepository.save(
      currentUserId(res),
      parsed.data,
      parsed.baseRevision
    );

    if (result.status === 'conflict') {
      // The client compares timestamps and retries against `remote`, so another
      // device's work is never silently overwritten.
      res.status(409).json({
        error: 'The study plan changed on another device.',
        remote: result.current,
      });
      return;
    }

    res.json(result.plan);
  });

  return router;
}
