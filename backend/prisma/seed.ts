/**
 * Database seed script.
 * Populates the database with example internship data for development/demo.
 */

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await prisma.fileAttachment.deleteMany();
    await prisma.dailyLog.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.report.deleteMany();
    await prisma.internshipConfig.deleteMany();
    await prisma.backup.deleteMany();

    // Create internship config
    await prisma.internshipConfig.create({
        data: {
            id: uuidv4(),
            startDate: "2026-02-16",
            requiredHours: 640,
            dailyHours: 8,
            workingDays: "1,2,3,4,5",
            location: "Lisboa, Portugal",
            studentName: "Aluno Exemplo",
            supervisorName: "Dr. Orientador",
            companyName: "Empresa Tecnológica, Lda.",
            courseName: "Engenharia Informática",
        },
    });

    // Create sample daily logs (10 entries starting from Feb 16, 2026)
    const sampleLogs = [
        { date: "2026-02-16", hours: 8, tasks: "Integração na equipa. Configuração do ambiente de desenvolvimento. Reunião de boas-vindas.", notes: "Primeiro dia de estágio" },
        { date: "2026-02-17", hours: 7.5, tasks: "Leitura de documentação técnica do projecto. Setup do repositório Git.", notes: null },
        { date: "2026-02-18", hours: 8, tasks: "Análise de requisitos. Participação em daily standup. Primeiros commits no projecto.", notes: null },
        { date: "2026-02-19", hours: 8, tasks: "Desenvolvimento de componentes frontend. Code review com mentor.", notes: "Boa progressão" },
        { date: "2026-02-20", hours: 7, tasks: "Implementação de API endpoints. Testes unitários.", notes: "Sexta-feira — saída mais cedo" },
        { date: "2026-02-23", hours: 8, tasks: "Correção de bugs. Reunião semanal de sprint planning.", notes: null },
        { date: "2026-02-24", hours: 8, tasks: "Desenvolvimento de funcionalidade de autenticação. Documentação.", notes: null },
        { date: "2026-02-25", hours: 8, tasks: "Integração com base de dados. Optimização de queries.", notes: null },
        { date: "2026-02-26", hours: 7.5, tasks: "Testes de integração. Deploy para ambiente staging.", notes: null },
        { date: "2026-02-27", hours: 8, tasks: "Revisão de código. Apresentação de progresso ao orientador.", notes: "Feedback positivo" },
    ];

    for (const log of sampleLogs) {
        await prisma.dailyLog.create({
            data: {
                id: uuidv4(),
                logDate: log.date,
                hoursCompleted: log.hours,
                tasksPerformed: log.tasks,
                notes: log.notes,
            },
        });
    }

    console.log(`✓ Created ${sampleLogs.length} sample daily logs`);
    console.log(`✓ Total sample hours: ${sampleLogs.reduce((sum, l) => sum + l.hours, 0)}h`);
    console.log("✓ Seed complete!");
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
