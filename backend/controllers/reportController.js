import crypto from 'node:crypto';
import { generateLeanReport, discussReport } from '../services/aiService.js';
import { reportRepository } from '../repositories/reportRepository.js';

export async function analyzeReport(req, res, next) {
  try {
    const { empresa = '', segmento, setor, descricao, restricoes = '' } = req.body || {};

    if (!segmento?.trim() || !setor?.trim() || !descricao?.trim()) {
      return res.status(400).json({
        error: 'Os campos segmento, setor e descricao são obrigatórios para gerar o diagnóstico Lean.',
      });
    }

    const problemData = {
      empresa: typeof empresa === 'string' ? empresa.trim() : '',
      segmento: segmento.trim(),
      setor: setor.trim(),
      descricao: descricao.trim(),
      restricoes: typeof restricoes === 'string' ? restricoes.trim() : '',
    };

    const analysis = await generateLeanReport(problemData);

    const now = new Date().toISOString();
    const newReport = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      createdAt: now,
      updatedAt: now,
      input: problemData,
      analysis,
      chatHistory: [],
    };

    await reportRepository.create(newReport);

    return res.status(201).json(newReport);
  } catch (error) {
    return next(error);
  }
}

export async function listReports(req, res, next) {
  try {
    const reports = await reportRepository.findAllByUser(req.user.id);
    const summaries = reports.map((report) => ({
      id: report.id,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      input: report.input,
      resumo_problema: report.analysis?.resumo_problema || '',
      totalDesperdicios: report.analysis?.diagnostico_lean?.desperdicios_timwoods?.length || 0,
      totalMensagensChat: report.chatHistory?.length || 0,
    }));

    return res.json(summaries);
  } catch (error) {
    return next(error);
  }
}

export async function getReportById(req, res, next) {
  try {
    const report = await reportRepository.findByIdForUser(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado.' });
    }
    return res.json(report);
  } catch (error) {
    return next(error);
  }
}

export async function chatAboutReport(req, res, next) {
  try {
    const { message } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
    }

    const report = await reportRepository.findByIdForUser(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado.' });
    }

    const trimmedMessage = message.trim();
    const assistantReply = await discussReport(report, report.chatHistory || [], trimmedMessage);

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toISOString(),
    };

    const updatedReport = await reportRepository.appendChatMessagesForUser(
      report.id,
      req.user.id,
      [userMsg, assistantMsg]
    );

    return res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      chatHistory: updatedReport.chatHistory,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteReport(req, res, next) {
  try {
    const deleted = await reportRepository.deleteByIdForUser(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Relatório não encontrado.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
