/**
 * PDF report generator using PDFKit.
 * Generates structured internship reports for mid-term (320h) and final (640h) milestones.
 */

import PDFDocument from "pdfkit";
import { ReportData } from "../models/types";

/**
 * Generate a PDF buffer from report data.
 */
export function generateReportPdf(data: ReportData, reportType: "midterm" | "final"): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // ─── Header ──────────────────────────────────────────────────
        doc.fontSize(22).font("Helvetica-Bold").text(
            reportType === "midterm" ? "Relatório Intercalar de Estágio" : "Relatório Final de Estágio",
            { align: "center" }
        );
        doc.moveDown(0.5);

        doc.fontSize(10).font("Helvetica").fillColor("#666")
            .text(`Gerado em: ${data.reportDate}`, { align: "center" });
        doc.moveDown(1.5);

        // ─── Identification ──────────────────────────────────────────
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text("Dados de Identificação");
        doc.moveDown(0.3);
        drawLine(doc);

        const idFields: [string, string | undefined][] = [
            ["Aluno(a)", data.studentName],
            ["Empresa", data.companyName],
            ["Orientador", data.supervisorName],
            ["Curso", data.courseName],
            ["Local", data.location],
        ];

        for (const [label, value] of idFields) {
            if (value) {
                doc.fontSize(11).font("Helvetica-Bold").text(`${label}: `, { continued: true });
                doc.font("Helvetica").text(value);
            }
        }
        doc.moveDown(1);

        // ─── Period & Hours ──────────────────────────────────────────
        doc.fontSize(14).font("Helvetica-Bold").text("Período e Horas");
        doc.moveDown(0.3);
        drawLine(doc);

        doc.fontSize(11).font("Helvetica");
        doc.text(`Período: ${data.periodCovered.from} a ${data.periodCovered.to}`);
        doc.text(`Horas realizadas: ${data.hoursCompleted}h de ${data.requiredHours}h`);
        doc.text(`Progresso: ${Math.round((data.hoursCompleted / data.requiredHours) * 100)}%`);
        doc.moveDown(1);

        // ─── Monthly Breakdown ───────────────────────────────────────
        if (data.hoursBreakdown.length > 0) {
            doc.fontSize(14).font("Helvetica-Bold").text("Distribuição Mensal de Horas");
            doc.moveDown(0.3);
            drawLine(doc);

            for (const item of data.hoursBreakdown) {
                doc.fontSize(11).font("Helvetica").text(`  ${item.month}: ${item.hours}h`);
            }
            doc.moveDown(1);
        }

        // ─── Activities ──────────────────────────────────────────────
        doc.fontSize(14).font("Helvetica-Bold").text("Resumo das Atividades");
        doc.moveDown(0.3);
        drawLine(doc);
        doc.fontSize(11).font("Helvetica").text(
            data.activitiesSummary || "(A preencher pelo estagiário)"
        );
        doc.moveDown(1);

        // ─── Skills ──────────────────────────────────────────────────
        doc.fontSize(14).font("Helvetica-Bold").text("Competências Desenvolvidas");
        doc.moveDown(0.3);
        drawLine(doc);
        if (data.skillsDeveloped.length > 0) {
            for (const skill of data.skillsDeveloped) {
                doc.fontSize(11).font("Helvetica").text(`  • ${skill}`);
            }
        } else {
            doc.fontSize(11).font("Helvetica").text("(A preencher pelo estagiário)");
        }
        doc.moveDown(1);

        // ─── Challenges ──────────────────────────────────────────────
        doc.fontSize(14).font("Helvetica-Bold").text("Desafios Enfrentados");
        doc.moveDown(0.3);
        drawLine(doc);
        if (data.challengesFaced.length > 0) {
            for (const challenge of data.challengesFaced) {
                doc.fontSize(11).font("Helvetica").text(`  • ${challenge}`);
            }
        } else {
            doc.fontSize(11).font("Helvetica").text("(A preencher pelo estagiário)");
        }
        doc.moveDown(1);

        // ─── Supervisor section (final report only) ──────────────────
        if (reportType === "final") {
            doc.addPage();
            doc.fontSize(14).font("Helvetica-Bold").text("Avaliação do Orientador");
            doc.moveDown(0.3);
            drawLine(doc);
            doc.fontSize(11).font("Helvetica").text("(Secção reservada ao orientador de estágio)");
            doc.moveDown(2);

            doc.text("Classificação: _______________");
            doc.moveDown(1);
            doc.text("Observações:");
            doc.moveDown(3);
            drawLine(doc);
            doc.moveDown(3);

            doc.text("Assinatura do Orientador: ___________________________", { align: "left" });
            doc.moveDown(1);
            doc.text(`Data: ____/____/________`, { align: "left" });
        }

        // ─── Footer ──────────────────────────────────────────────────
        doc.moveDown(2);
        doc.fontSize(8).fillColor("#999").text(
            "Documento gerado automaticamente pelo sistema StageSync",
            { align: "center" }
        );

        doc.end();
    });
}

function drawLine(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc.strokeColor("#ddd").lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
    doc.moveDown(0.5);
}
