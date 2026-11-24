import { Router } from 'express';
import { toPublicUser, userRepository } from '../repositories/userRepository.js';
import { reportRepository } from '../repositories/reportRepository.js';

const router = Router();

router.get('/users', async (_req, res, next) => {
  try {
    const reportMap = await reportRepository.countByUserMap();
    const users = await userRepository.findAllWithStats(reportMap);
    const publicUsers = users.map(toPublicUser);

    const stats = {
      totalUsers: publicUsers.length,
      activeUsers: publicUsers.filter((u) => !u.isBlocked).length,
      blockedUsers: publicUsers.filter((u) => u.isBlocked).length,
      totalReports: publicUsers.reduce((acc, u) => acc + (u.reportCount || 0), 0),
    };

    return res.json({ users: publicUsers, stats });
  } catch (err) {
    return next(err);
  }
});

router.patch('/users/:id/block', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const { isBlocked } = req.body || {};

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ error: 'Informe isBlocked como true ou false.' });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({
        error: 'Você não pode bloquear sua própria conta de administrador.',
      });
    }

    const updated = await userRepository.setBlocked(targetId, isBlocked);
    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ user: toPublicUser(updated) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({
        error: 'Você não pode excluir sua própria conta de administrador.',
      });
    }

    await reportRepository.deleteAllByUser(targetId);
    const deleted = await userRepository.deleteById(targetId);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;
