import { Prisma } from '@prisma/client';

export async function getNextDocNo(
  tx: Prisma.TransactionClient,
  tenantId: string,
  docType: 'invoice' | 'purchase' | 'transfer' | 'payment' | 'sale_return' | 'purchase_return',
  prefix: string
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const seq = await tx.docSequence.upsert({
    where: {
      tenantId_docType_year: {
        tenantId,
        docType,
        year: currentYear,
      },
    },
    update: {
      lastNo: { increment: 1 },
    },
    create: {
      tenantId,
      docType,
      year: currentYear,
      lastNo: 1,
    },
  });

  const paddedNo = String(seq.lastNo).padStart(5, '0');
  return `${prefix}-${currentYear}-${paddedNo}`;
}
