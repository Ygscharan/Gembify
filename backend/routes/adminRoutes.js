import { Router } from 'express';
import { toAdminUser, userRepository } from '../repositories/userRepository.js';
import { reportRepository } from '../repositories/reportRepository.js';

const router = Router();

router.get('/users', async (_req, res, next) => {
  try {
    const reportMap = await reportRepository.countByUserMap();
    const users = await userRepository.findAllWithStats(reportMap);
    const adminUsers = users.map(toAdminUser);

    const stats = {
      totalUsers: adminUsers.length,
      activeUsers: adminUsers.filter((u) => !u.isBlocked).length,
      blockedUsers: adminUsers.filter((u) => u.isBlocked).length,
      totalReports: adminUsers.reduce((acc, u) => acc + (u.reportCount || 0), 0),
    };

    return res.json({ users: adminUsers, stats });
  } catch (err) {
    return next(err);
  }
});

router.patch('/users/:id/password', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const { password = '' } = req.body || {};
    const value = String(password);

    const valid =
      value.length >= 6 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[^A-Za-z0-9\s]/.test(value);

    if (!valid) {
      return res.status(400).json({
        error:
          'A nova senha deve ter no mínimo 6 caracteres, incluindo 1 letra maiúscula, letras minúsculas e 1 caractere especial (ex: !@#$%&*).',
      });
    }

    const updated = await userRepository.updatePassword(targetId, value);
    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ user: toAdminUser(updated) });
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

    return res.json({ user: toAdminUser(updated) });
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
