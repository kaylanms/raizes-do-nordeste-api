import 'dotenv/config';
import { PrismaClient, Perfil } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Senha única, ambiente de teste e  correção...
const SENHA_TESTE = 'Senha@123';

async function main() {
  await prisma.logAuditoria.deleteMany();
  await prisma.movimentoPontos.deleteMany();
  await prisma.movimentoEstoque.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.consentimento.deleteMany();
  await prisma.estoque.deleteMany();
  await prisma.cardapioUnidade.deleteMany();
  await prisma.promocao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.unidade.deleteMany();

  const senhaHash = await bcrypt.hash(SENHA_TESTE, 10);

  const matriz = await prisma.unidade.create({
    data: { nome: 'Matriz Recife', cidade: 'Recife', uf: 'PE', matriz: true },
  });
  const fortaleza = await prisma.unidade.create({
    data: { nome: 'Unidade Fortaleza', cidade: 'Fortaleza', uf: 'CE' },
  });
  const salvador = await prisma.unidade.create({
    data: { nome: 'Unidade Salvador', cidade: 'Salvador', uf: 'BA' },
  });

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@raizes.com',
      senhaHash,
      perfil: Perfil.ADMIN,
    },
  });
  await prisma.usuario.create({
    data: {
      nome: 'Gerente Matriz',
      email: 'gerente@raizes.com',
      senhaHash,
      perfil: Perfil.GERENTE,
      unidadeId: matriz.id,
    },
  });
  await prisma.usuario.create({
    data: {
      nome: 'Atendente Matriz',
      email: 'atendente@raizes.com',
      senhaHash,
      perfil: Perfil.ATENDENTE,
      unidadeId: matriz.id,
    },
  });
  await prisma.usuario.create({
    data: {
      nome: 'Cozinha Matriz',
      email: 'cozinha@raizes.com',
      senhaHash,
      perfil: Perfil.COZINHA,
      unidadeId: matriz.id,
    },
  });
  const maria = await prisma.usuario.create({
    data: {
      nome: 'Maria Silva',
      email: 'maria@exemplo.com',
      senhaHash,
      perfil: Perfil.CLIENTE,
    },
  });
  await prisma.usuario.create({
    data: {
      nome: 'João Souza',
      email: 'joao@exemplo.com',
      senhaHash,
      perfil: Perfil.CLIENTE,
    },
  });

  await prisma.consentimento.create({
    data: {
      usuarioId: maria.id,
      finalidade: 'FIDELIDADE',
      baseLegal: 'Consentimento (LGPD, art. 7º, I)',
      versaoTermo: 'v1.0',
      concedido: true,
    },
  });

  const dados = [
    {
      nome: 'Baião de Dois com Carne de Sol',
      categoria: 'Pratos',
      preco: '39.90',
    },
    { nome: 'Tapioca de Queijo Coalho', categoria: 'Lanches', preco: '14.90' },
    { nome: 'Cuscuz Nordestino', categoria: 'Pratos', preco: '18.50' },
    { nome: 'Suco de Cajá', categoria: 'Bebidas', preco: '9.90' },
    { nome: 'Bolo de Rolo', categoria: 'Sobremesas', preco: '12.00' },
    { nome: 'Macaxeira Frita', categoria: 'Porções', preco: '22.90' },
  ];
  const produtos = [];
  for (const p of dados) {
    produtos.push(
      await prisma.produto.create({
        data: {
          nome: p.nome,
          categoria: p.categoria,
          precoBase: p.preco,
          descricao: `${p.nome} da casa`,
        },
      }),
    );
  }
  const macaxeira = produtos[5];
  const boloDeRolo = produtos[4];

  for (const unidade of [matriz, fortaleza, salvador]) {
    for (const produto of produtos) {
      if (unidade.id === salvador.id && produto.id === boloDeRolo.id) continue;

      await prisma.cardapioUnidade.create({
        data: {
          unidadeId: unidade.id,
          produtoId: produto.id,
          preco: produto.precoBase,
        },
      });

      const quantidade =
        unidade.id === matriz.id && produto.id === macaxeira.id ? 1 : 50;

      const estoque = await prisma.estoque.create({
        data: { unidadeId: unidade.id, produtoId: produto.id, quantidade },
      });
      await prisma.movimentoEstoque.create({
        data: {
          estoqueId: estoque.id,
          usuarioId: admin.id,
          tipo: 'ENTRADA',
          quantidade,
          motivo: 'Carga inicial (seed)',
        },
      });
    }
  }

  const agora = new Date();
  const umAnoDepois = new Date();
  umAnoDepois.setFullYear(agora.getFullYear() + 1);
  await prisma.promocao.create({
    data: {
      codigo: 'BEMVINDO10',
      descricao: '10% de desconto no pedido',
      tipo: 'PERCENTUAL',
      valor: '10.00',
      inicio: agora,
      fim: umAnoDepois,
    },
  });

  console.log('Seed concluído com sucesso.');
  console.log(`Senha de todos os usuários de teste: ${SENHA_TESTE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
