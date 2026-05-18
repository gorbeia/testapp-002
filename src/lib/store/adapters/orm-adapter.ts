// ORM storage adapter — wraps the shared PrismaClient singleton and exposes all
// repository interfaces defined in types.ts.
//
// Schema gaps vs. StoredXxx types:
//   - StoredProduct.imageUrl      ← Product.customerImageUrl
//   - StoredProduct.removableIngredients ← Product.ingredients (comma-split string)
//   - StoredProduct.kitchenPost   ← not in schema; always null
//   - StoredProduct.available     ← not on Product (lives on TxosnaProduct); always true
//   - StoredProduct.splitMaxWays  ← not in schema; always 2
//   - StoredOrder.total           ← not in schema; always 0
//   - StoredOrder.pendingLines    ← not in schema; always null
//   - StoredTicket.notes          ← not in schema; always null
//   - StoredTicket.kitchenPost    ← not in schema; always null
//   - StoredTxosna.waitMinutes    ← not in schema; always null

/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AssociationRepository,
  CatalogRepository,
  CreateCategoryInput,
  CreateModifierInput,
  CreateOrderInput,
  CreatePaymentProviderInput,
  CreateProductInput,
  CreateTicketInput,
  CreateTxosnaInput,
  CreateVariantGroupInput,
  CreateVolunteerInput,
  OrderFilter,
  OrderRepository,
  PaymentProviderRepository,
  StoredAssociation,
  StoredCategory,
  StoredModifier,
  StoredOrder,
  StoredOrderLine,
  StoredPaymentProvider,
  StoredProduct,
  StoredProductView,
  StoredTicket,
  StoredTicketBaiConfig,
  StoredTicketBaiInvoice,
  StoredTxosna,
  StoredTxosnaProduct,
  StoredVariantGroup,
  StoredVariantOption,
  StoredVatType,
  StoredVolunteer,
  TicketBaiConfigRepository,
  TicketBaiInvoiceRepository,
  TicketFilter,
  TicketRepository,
  TxosnaRepository,
  VatTypeRepository,
  VolunteerRepository,
} from '../types';

export class ORMStorageAdapter {
  constructor(private readonly prisma: any) {}

  // ── Mappers ────────────────────────────────────────────────────────────────

  private mapAssociation(r: any): StoredAssociation {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      cif: r.cif ?? null,
      ticketBaiEnabled: r.ticketBaiEnabled ?? false,
      createdAt: r.createdAt,
    };
  }

  private mapTxosna(r: any): StoredTxosna {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      status: r.status,
      counterSetup: r.counterSetup,
      kitchenPosts: r.kitchenPosts ?? [],
      waitMinutes: null, // not in schema
      pinHash: r.pinHash,
      enabledChannels: r.enabledChannels ?? [],
      enabledPaymentMethods: r.enabledPaymentMethods ?? [],
      pendingPaymentTimeout: r.pendingPaymentTimeout ?? 15,
      printingEnabled: r.printingEnabled ?? false,
      mobileTrackingEnabled: r.mobileTrackingEnabled ?? false,
      associationId: r.associationId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapCategory(r: any): StoredCategory {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      displayOrder: r.displayOrder ?? 0,
      associationId: r.associationId,
    };
  }

  private mapVariantOption(r: any): StoredVariantOption {
    return {
      id: r.id,
      name: r.name,
      priceDelta: Number(r.priceDelta ?? 0),
      allergens: r.allergens ?? [],
      displayOrder: r.displayOrder ?? 0,
      kitchenPost: null, // not in schema
    };
  }

  private mapVariantGroup(r: any): StoredVariantGroup {
    return {
      id: r.id,
      name: r.name,
      displayOrder: r.displayOrder ?? 0,
      options: (r.options ?? []).map((o: any) => this.mapVariantOption(o)),
    };
  }

  private mapModifier(r: any): StoredModifier {
    return {
      id: r.id,
      name: r.name,
      price: Number(r.price ?? 0),
      allergens: r.allergens ?? [],
      displayOrder: r.displayOrder ?? 0,
      kitchenPost: null, // not in schema
    };
  }

  private mapProduct(r: any): StoredProduct {
    return {
      id: r.id,
      categoryId: r.categoryId,
      name: r.name,
      description: r.description ?? null,
      defaultPrice: Number(r.defaultPrice ?? 0),
      imageUrl: r.customerImageUrl ?? null,
      allergens: r.allergens ?? [],
      dietaryFlags: r.dietaryFlags ?? [],
      ageRestricted: r.ageRestricted ?? false,
      requiresPreparation: r.requiresPreparation ?? false,
      available: true, // product-level flag; txosna override is on TxosnaProduct
      splittable: r.splittable ?? false,
      splitMaxWays: 2, // not in schema
      removableIngredients: r.ingredients
        ? r.ingredients
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      preparationInstructions: r.preparationInstructions ?? null,
      displayOrder: r.displayOrder ?? 0,
      kitchenPost: null, // not in schema
      vatTypeId: r.vatTypeId ?? null,
      variantGroups: (r.variantGroups ?? []).map((vg: any) => this.mapVariantGroup(vg)),
      modifiers: (r.modifiers ?? []).map((m: any) => this.mapModifier(m)),
    };
  }

  private mapProductView(product: any, txosnaProduct: any): StoredProductView {
    const base = this.mapProduct(product);
    return {
      ...base,
      effectivePrice:
        txosnaProduct?.priceOverride != null
          ? Number(txosnaProduct.priceOverride)
          : base.defaultPrice,
      available: base.available && (txosnaProduct?.available ?? true),
      soldOut: txosnaProduct?.soldOut ?? false,
      preparationInstructions:
        txosnaProduct?.preparationInstructions ?? base.preparationInstructions,
    };
  }

  private mapTxosnaProduct(r: any): StoredTxosnaProduct {
    return {
      txosnaId: r.txosnaId,
      productId: r.productId,
      priceOverride: r.priceOverride != null ? Number(r.priceOverride) : null,
      available: r.available ?? true,
      soldOut: r.soldOut ?? false,
      preparationInstructions: r.preparationInstructions ?? null,
    };
  }

  private mapOrderLine(r: any): StoredOrderLine {
    return {
      id: r.id,
      productId: r.productId,
      productName: r.product?.name ?? r.productId,
      quantity: r.quantity,
      unitPrice: Number(r.unitPrice ?? 0),
      selectedVariant: r.selectedVariants?.[0]?.variantOption?.name ?? null,
      selectedModifiers: (r.selectedModifiers ?? []).map(
        (sm: any) => sm.modifier?.name ?? sm.modifierId
      ),
      splitInstructions: r.splitInstructions ?? null,
    };
  }

  private mapTicket(r: any): StoredTicket {
    return {
      id: r.id,
      orderId: r.orderId,
      txosnaId: r.order?.txosnaId ?? r.txosnaId ?? '',
      counterType: r.counterType,
      kitchenPost: null, // not in schema
      status: r.status,
      requiresPreparation: r.requiresPreparation ?? false,
      flagged: r.flagged ?? false,
      orderChangedAlert: r.orderChangedAlert ?? false,
      notes: null, // not in schema
      lines: (r.lines ?? []).map((l: any) => this.mapOrderLine(l)),
      createdAt: r.createdAt,
      readyAt: r.readyAt ?? null,
      completedAt: r.completedAt ?? null,
      updatedAt: r.updatedAt,
    };
  }

  private mapOrder(r: any): StoredOrder {
    return {
      id: r.id,
      orderNumber: r.orderNumber,
      txosnaId: r.txosnaId,
      status: r.status,
      cancellationReason: r.cancellationReason ?? null,
      channel: r.channel,
      paymentMethod: r.paymentMethod ?? null,
      customerName: r.customerName ?? null,
      notes: r.notes ?? null,
      total: 0, // not in schema; computed from lines if needed
      verificationCode: r.verificationCode,
      registeredById: r.registeredById ?? null,
      paymentSessionId: r.paymentSessionId ?? null,
      confirmedAt: r.confirmedAt ?? null,
      expiresAt: r.expiresAt ?? null,
      pendingLines: null, // not persisted to DB
      fiscalReceiptRef: r.fiscalReceiptRef ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapVolunteer(r: any): StoredVolunteer {
    return {
      id: r.id,
      associationId: r.associationId,
      name: r.name,
      email: r.email,
      passwordHash: r.passwordHash,
      role: r.role,
      active: r.active ?? true,
      passwordResetToken: r.passwordResetToken ?? null,
      passwordResetExpiresAt: r.passwordResetExpiresAt ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapTicketBaiConfig(r: any): StoredTicketBaiConfig {
    return {
      id: r.id,
      associationId: r.associationId,
      providerType: r.providerType,
      territory: r.territory ?? null,
      series: r.series,
      credentials:
        typeof r.credentials === 'string'
          ? (JSON.parse(r.credentials) as Record<string, string>)
          : (r.credentials as Record<string, string>),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapTicketBaiInvoice(r: any): StoredTicketBaiInvoice {
    return {
      id: r.id,
      associationId: r.associationId,
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      series: r.series,
      invoiceNumber: r.invoiceNumber,
      issuedAt: r.issuedAt,
      sellerName: r.sellerName,
      sellerCif: r.sellerCif,
      lines: Array.isArray(r.linesJson) ? r.linesJson : JSON.parse(r.linesJson ?? '[]'),
      total: Number(r.total ?? 0),
      vatBreakdown: Array.isArray(r.vatJson) ? r.vatJson : JSON.parse(r.vatJson ?? '[]'),
      chainId: r.chainId,
      providerRef: r.providerRef ?? null,
      qrUrl: r.qrUrl ?? null,
      xmlPayload: r.xmlPayload ?? null,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapPaymentProvider(r: any): StoredPaymentProvider {
    return {
      id: r.id,
      associationId: r.associationId,
      providerType: r.providerType,
      displayName: r.displayName ?? null,
      enabled: r.enabled ?? true,
      testMode: r.testMode ?? true,
      credentials:
        typeof r.credentials === 'string'
          ? (JSON.parse(r.credentials) as Record<string, string>)
          : ((r.credentials ?? {}) as Record<string, string>),
      bizumEnabled: r.bizumEnabled ?? false,
      verifiedAt: r.verifiedAt ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapVatType(r: any): StoredVatType {
    return {
      id: r.id,
      associationId: r.associationId,
      label: r.label,
      percentage: Number(r.percentage),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  // ── Includes ───────────────────────────────────────────────────────────────

  private readonly productInclude = {
    variantGroups: {
      orderBy: { displayOrder: 'asc' as const },
      include: { options: { orderBy: { displayOrder: 'asc' as const } } },
    },
    modifiers: { orderBy: { displayOrder: 'asc' as const } },
  };

  private readonly ticketInclude = {
    order: { select: { txosnaId: true } },
    lines: {
      include: {
        product: { select: { name: true } },
        selectedVariants: { include: { variantOption: { select: { name: true } } } },
        selectedModifiers: { include: { modifier: { select: { name: true } } } },
      },
    },
  };

  // ── AssociationRepository ──────────────────────────────────────────────────

  get associations(): AssociationRepository {
    return {
      create: async (name: string): Promise<StoredAssociation> => {
        const r = await this.prisma.association.create({ data: { name } });
        return this.mapAssociation(r);
      },

      findById: async (id: string): Promise<StoredAssociation | null> => {
        const r = await this.prisma.association.findUnique({ where: { id } });
        return r ? this.mapAssociation(r) : null;
      },

      findByName: async (query: string): Promise<StoredAssociation | null> => {
        const r = await this.prisma.association.findFirst({
          where: { name: { contains: query, mode: 'insensitive' } },
        });
        return r ? this.mapAssociation(r) : null;
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredAssociation, 'id' | 'createdAt'>>
      ): Promise<StoredAssociation> => {
        const r = await this.prisma.association.update({ where: { id }, data: patch });
        return this.mapAssociation(r);
      },
    };
  }

  // ── TxosnaRepository ───────────────────────────────────────────────────────

  get txosnak(): TxosnaRepository {
    return {
      findBySlug: async (slug: string): Promise<StoredTxosna | null> => {
        const r = await this.prisma.txosna.findUnique({ where: { slug } });
        return r ? this.mapTxosna(r) : null;
      },

      findById: async (id: string): Promise<StoredTxosna | null> => {
        const r = await this.prisma.txosna.findUnique({ where: { id } });
        return r ? this.mapTxosna(r) : null;
      },

      list: async (associationId: string): Promise<StoredTxosna[]> => {
        const rows = await this.prisma.txosna.findMany({
          where: { associationId },
          orderBy: { createdAt: 'asc' },
        });
        return rows.map((r: any) => this.mapTxosna(r));
      },

      create: async (data: CreateTxosnaInput): Promise<StoredTxosna> => {
        let eventId = data.eventId;
        if (!eventId) {
          // Create a placeholder Event since the schema requires one
          const event = await this.prisma.event.create({
            data: {
              name: data.name,
              date: new Date(),
              location: '',
              associationId: data.associationId,
            },
          });
          eventId = event.id;
        }
        const r = await this.prisma.txosna.create({
          data: {
            name: data.name,
            slug: data.slug,
            pinHash: data.pinHash ?? '',
            status: 'OPEN',
            counterSetup: 'SINGLE',
            enabledChannels: ['COUNTER'],
            enabledPaymentMethods: ['CASH'],
            pendingPaymentTimeout: 15,
            printingEnabled: false,
            mobileTrackingEnabled: false,
            associationId: data.associationId,
            eventId,
          },
        });
        return this.mapTxosna(r);
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredTxosna, 'id' | 'createdAt'>>
      ): Promise<StoredTxosna> => {
        // Strip fields that don't exist in the DB schema
        const { waitMinutes: _wm, ...dbPatch } = patch as any;
        const r = await this.prisma.txosna.update({ where: { id }, data: dbPatch });
        return this.mapTxosna(r);
      },
    };
  }

  // ── CatalogRepository ──────────────────────────────────────────────────────

  get catalog(): CatalogRepository {
    return {
      listCategories: async (associationId: string): Promise<StoredCategory[]> => {
        const rows = await this.prisma.category.findMany({
          where: { associationId },
          orderBy: { displayOrder: 'asc' },
        });
        return rows.map((r: any) => this.mapCategory(r));
      },

      findCategory: async (id: string): Promise<StoredCategory | null> => {
        const r = await this.prisma.category.findUnique({ where: { id } });
        return r ? this.mapCategory(r) : null;
      },

      listProducts: async (categoryId: string): Promise<StoredProduct[]> => {
        const rows = await this.prisma.product.findMany({
          where: { categoryId },
          orderBy: { displayOrder: 'asc' },
          include: this.productInclude,
        });
        return rows.map((r: any) => this.mapProduct(r));
      },

      getProduct: async (productId: string): Promise<StoredProduct | null> => {
        const r = await this.prisma.product.findUnique({
          where: { id: productId },
          include: this.productInclude,
        });
        return r ? this.mapProduct(r) : null;
      },

      getProductView: async (
        productId: string,
        txosnaId: string
      ): Promise<StoredProductView | null> => {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          include: this.productInclude,
        });
        if (!product) return null;
        const tp = await this.prisma.txosnaProduct.findUnique({
          where: { txosnaId_productId: { txosnaId, productId } },
        });
        return this.mapProductView(product, tp);
      },

      listProductViews: async (
        txosnaId: string
      ): Promise<{ category: StoredCategory; products: StoredProductView[] }[]> => {
        const txosna = await this.prisma.txosna.findUnique({ where: { id: txosnaId } });
        if (!txosna) return [];
        const categories = await this.prisma.category.findMany({
          where: { associationId: txosna.associationId },
          orderBy: { displayOrder: 'asc' },
          include: {
            products: {
              orderBy: { displayOrder: 'asc' },
              include: {
                ...this.productInclude,
                txosnaProducts: { where: { txosnaId } },
              },
            },
          },
        });
        return categories.map((cat: any) => ({
          category: this.mapCategory(cat),
          products: cat.products.map((p: any) =>
            this.mapProductView(p, p.txosnaProducts?.[0] ?? null)
          ),
        }));
      },

      createCategory: async (data: CreateCategoryInput): Promise<StoredCategory> => {
        const max = await this.prisma.category.findFirst({
          where: { associationId: data.associationId },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true },
        });
        const r = await this.prisma.category.create({
          data: { ...data, displayOrder: (max?.displayOrder ?? -1) + 1 },
        });
        return this.mapCategory(r);
      },

      updateCategory: async (
        id: string,
        patch: Partial<Pick<StoredCategory, 'name' | 'type' | 'displayOrder'>>
      ): Promise<StoredCategory> => {
        const r = await this.prisma.category.update({ where: { id }, data: patch });
        return this.mapCategory(r);
      },

      deleteCategory: async (id: string): Promise<void> => {
        await this.prisma.category.delete({ where: { id } });
      },

      reorderCategories: async (_associationId: string, ids: string[]): Promise<void> => {
        await this.prisma.$transaction(
          ids.map((id, index) =>
            this.prisma.category.update({ where: { id }, data: { displayOrder: index } })
          )
        );
      },

      createProduct: async (data: CreateProductInput): Promise<StoredProduct> => {
        const max = await this.prisma.product.findFirst({
          where: { categoryId: data.categoryId },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true },
        });
        const r = await this.prisma.product.create({
          data: {
            name: data.name,
            categoryId: data.categoryId,
            defaultPrice: data.defaultPrice,
            description: data.description ?? null,
            customerImageUrl: data.customerImageUrl ?? null,
            allergens: data.allergens ?? [],
            dietaryFlags: data.dietaryFlags ?? [],
            ageRestricted: data.ageRestricted ?? false,
            splittable: data.splittable ?? false,
            requiresPreparation: data.requiresPreparation ?? false,
            displayOrder: data.displayOrder ?? (max?.displayOrder ?? -1) + 1,
            ingredients: data.ingredients ?? null,
            preparationInstructions: data.preparationInstructions ?? null,
            vatTypeId: data.vatTypeId ?? null,
            variantGroups: data.variantGroups?.length
              ? {
                  create: data.variantGroups.map((vg: CreateVariantGroupInput, i: number) => ({
                    name: vg.name,
                    displayOrder: vg.displayOrder ?? i,
                    options: {
                      create: (vg.options ?? []).map((opt, oi: number) => ({
                        name: opt.name,
                        priceDelta: opt.priceDelta ?? 0,
                        allergens: opt.allergens ?? [],
                        displayOrder: opt.displayOrder ?? oi,
                      })),
                    },
                  })),
                }
              : undefined,
            modifiers: data.modifiers?.length
              ? {
                  create: data.modifiers.map((mod: CreateModifierInput, i: number) => ({
                    name: mod.name,
                    price: mod.price ?? 0,
                    allergens: mod.allergens ?? [],
                    displayOrder: mod.displayOrder ?? i,
                  })),
                }
              : undefined,
          },
          include: this.productInclude,
        });
        return this.mapProduct(r);
      },

      updateProduct: async (
        id: string,
        patch: Partial<CreateProductInput>
      ): Promise<StoredProduct> => {
        await this.prisma.$transaction(async (tx: any) => {
          if (patch.variantGroups !== undefined) {
            await tx.variantGroup.deleteMany({ where: { productId: id } });
          }
          if (patch.modifiers !== undefined) {
            await tx.modifier.deleteMany({ where: { productId: id } });
          }
          await tx.product.update({
            where: { id },
            data: {
              ...(patch.name !== undefined && { name: patch.name }),
              ...(patch.categoryId !== undefined && { categoryId: patch.categoryId }),
              ...(patch.defaultPrice !== undefined && { defaultPrice: patch.defaultPrice }),
              ...(patch.description !== undefined && { description: patch.description }),
              ...(patch.customerImageUrl !== undefined && {
                customerImageUrl: patch.customerImageUrl,
              }),
              ...(patch.allergens !== undefined && { allergens: patch.allergens }),
              ...(patch.dietaryFlags !== undefined && { dietaryFlags: patch.dietaryFlags }),
              ...(patch.ageRestricted !== undefined && { ageRestricted: patch.ageRestricted }),
              ...(patch.splittable !== undefined && { splittable: patch.splittable }),
              ...(patch.requiresPreparation !== undefined && {
                requiresPreparation: patch.requiresPreparation,
              }),
              ...(patch.displayOrder !== undefined && { displayOrder: patch.displayOrder }),
              ...(patch.ingredients !== undefined && { ingredients: patch.ingredients }),
              ...(patch.preparationInstructions !== undefined && {
                preparationInstructions: patch.preparationInstructions,
              }),
              ...(patch.vatTypeId !== undefined && { vatTypeId: patch.vatTypeId ?? null }),
              ...(patch.variantGroups?.length && {
                variantGroups: {
                  create: patch.variantGroups.map((vg, i) => ({
                    name: vg.name,
                    displayOrder: vg.displayOrder ?? i,
                    options: {
                      create: (vg.options ?? []).map((opt, oi) => ({
                        name: opt.name,
                        priceDelta: opt.priceDelta ?? 0,
                        allergens: opt.allergens ?? [],
                        displayOrder: opt.displayOrder ?? oi,
                      })),
                    },
                  })),
                },
              }),
              ...(patch.modifiers?.length && {
                modifiers: {
                  create: patch.modifiers.map((mod, i) => ({
                    name: mod.name,
                    price: mod.price ?? 0,
                    allergens: mod.allergens ?? [],
                    displayOrder: mod.displayOrder ?? i,
                  })),
                },
              }),
            },
          });
        });
        const r = await this.prisma.product.findUnique({
          where: { id },
          include: this.productInclude,
        });
        return this.mapProduct(r);
      },

      deleteProduct: async (id: string): Promise<void> => {
        await this.prisma.product.delete({ where: { id } });
      },

      reorderProducts: async (_categoryId: string, ids: string[]): Promise<void> => {
        await this.prisma.$transaction(
          ids.map((id, index) =>
            this.prisma.product.update({ where: { id }, data: { displayOrder: index } })
          )
        );
      },

      listTxosnaProducts: async (txosnaId: string): Promise<StoredTxosnaProduct[]> => {
        const rows = await this.prisma.txosnaProduct.findMany({ where: { txosnaId } });
        return rows.map((r: any) => this.mapTxosnaProduct(r));
      },

      upsertTxosnaProduct: async (
        txosnaId: string,
        productId: string,
        data: Partial<
          Pick<
            StoredTxosnaProduct,
            'available' | 'soldOut' | 'priceOverride' | 'preparationInstructions'
          >
        >
      ): Promise<StoredTxosnaProduct> => {
        const r = await this.prisma.txosnaProduct.upsert({
          where: { txosnaId_productId: { txosnaId, productId } },
          create: {
            txosnaId,
            productId,
            available: data.available ?? true,
            soldOut: data.soldOut ?? false,
            priceOverride: data.priceOverride ?? null,
            preparationInstructions: data.preparationInstructions ?? null,
          },
          update: {
            ...(data.available !== undefined && { available: data.available }),
            ...(data.soldOut !== undefined && { soldOut: data.soldOut }),
            ...(data.priceOverride !== undefined && { priceOverride: data.priceOverride }),
            ...(data.preparationInstructions !== undefined && {
              preparationInstructions: data.preparationInstructions,
            }),
          },
        });
        return this.mapTxosnaProduct(r);
      },

      deleteTxosnaProduct: async (txosnaId: string, productId: string): Promise<void> => {
        await this.prisma.txosnaProduct.deleteMany({ where: { txosnaId, productId } });
      },
    };
  }

  // ── OrderRepository ────────────────────────────────────────────────────────

  get orders(): OrderRepository {
    return {
      create: async (data: CreateOrderInput): Promise<StoredOrder> => {
        const r = await this.prisma.order.create({
          data: {
            txosnaId: data.txosnaId,
            orderNumber: await this.prisma.order
              .findFirst({ where: { txosnaId: data.txosnaId }, orderBy: { orderNumber: 'desc' } })
              .then((last: any) => (last?.orderNumber ?? 0) + 1),
            verificationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            status: data.status,
            channel: data.channel,
            paymentMethod: data.paymentMethod ?? null,
            customerName: data.customerName ?? null,
            notes: data.notes ?? null,
            registeredById: data.registeredById ?? null,
            expiresAt: data.expiresAt ?? null,
          },
        });
        return this.mapOrder(r);
      },

      findById: async (id: string): Promise<StoredOrder | null> => {
        const r = await this.prisma.order.findUnique({ where: { id } });
        return r ? this.mapOrder(r) : null;
      },

      findByNumber: async (txosnaId: string, orderNumber: number): Promise<StoredOrder | null> => {
        const r = await this.prisma.order.findFirst({ where: { txosnaId, orderNumber } });
        return r ? this.mapOrder(r) : null;
      },

      findByPaymentSessionId: async (sessionId: string): Promise<StoredOrder | null> => {
        const r = await this.prisma.order.findFirst({ where: { paymentSessionId: sessionId } });
        return r ? this.mapOrder(r) : null;
      },

      findByVerificationCode: async (
        txosnaId: string,
        code: string
      ): Promise<StoredOrder | null> => {
        const r = await this.prisma.order.findFirst({
          where: { txosnaId, verificationCode: code },
        });
        return r ? this.mapOrder(r) : null;
      },

      listByTxosna: async (txosnaId: string, filter?: OrderFilter): Promise<StoredOrder[]> => {
        const where: any = { txosnaId };
        if (filter?.status) where.status = filter.status;
        if (filter?.channel) where.channel = filter.channel;
        if (filter?.since) where.createdAt = { gte: filter.since };
        const rows = await this.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r: any) => this.mapOrder(r));
      },

      update: async (id: string, patch: Partial<Omit<StoredOrder, 'id'>>): Promise<StoredOrder> => {
        // Strip fields that don't exist in the DB schema
        const { total: _t, pendingLines: _pl, ...dbPatch } = patch as any;
        const r = await this.prisma.order.update({
          where: { id },
          data: { ...dbPatch, updatedAt: new Date() },
        });
        return this.mapOrder(r);
      },

      nextOrderNumber: async (txosnaId: string): Promise<number> => {
        const last = await this.prisma.order.findFirst({
          where: { txosnaId },
          orderBy: { orderNumber: 'desc' },
          select: { orderNumber: true },
        });
        return (last?.orderNumber ?? 0) + 1;
      },
    };
  }

  // ── TicketRepository ───────────────────────────────────────────────────────

  get tickets(): TicketRepository {
    return {
      create: async (
        orderId: string,
        _txosnaId: string,
        data: CreateTicketInput
      ): Promise<StoredTicket> => {
        const r = await this.prisma.orderTicket.create({
          data: {
            orderId,
            counterType: data.counterType,
            requiresPreparation: data.requiresPreparation,
            status: 'RECEIVED',
            lines: {
              create: data.lines.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                splitInstructions: line.splitInstructions ?? null,
              })),
            },
          },
          include: this.ticketInclude,
        });
        return this.mapTicket(r);
      },

      findById: async (id: string): Promise<StoredTicket | null> => {
        const r = await this.prisma.orderTicket.findUnique({
          where: { id },
          include: this.ticketInclude,
        });
        return r ? this.mapTicket(r) : null;
      },

      listByTxosna: async (txosnaId: string, filter?: TicketFilter): Promise<StoredTicket[]> => {
        const where: any = { order: { txosnaId } };
        if (filter?.status) where.status = filter.status;
        if (filter?.counterType) where.counterType = filter.counterType;
        const rows = await this.prisma.orderTicket.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: this.ticketInclude,
        });
        return rows.map((r: any) => this.mapTicket(r));
      },

      listByOrder: async (orderId: string): Promise<StoredTicket[]> => {
        const rows = await this.prisma.orderTicket.findMany({
          where: { orderId },
          orderBy: { createdAt: 'asc' },
          include: this.ticketInclude,
        });
        return rows.map((r: any) => this.mapTicket(r));
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredTicket, 'id' | 'orderId' | 'txosnaId' | 'createdAt' | 'lines'>>
      ): Promise<StoredTicket> => {
        // Strip fields not in DB schema
        const { notes: _n, kitchenPost: _kp, ...dbPatch } = patch as any;
        const r = await this.prisma.orderTicket.update({
          where: { id },
          data: { ...dbPatch, updatedAt: new Date() },
          include: this.ticketInclude,
        });
        return this.mapTicket(r);
      },
    };
  }

  // ── VolunteerRepository ────────────────────────────────────────────────────

  get volunteers(): VolunteerRepository {
    return {
      findByEmail: async (email: string): Promise<StoredVolunteer | null> => {
        const r = await this.prisma.volunteer.findUnique({ where: { email } });
        return r ? this.mapVolunteer(r) : null;
      },

      findById: async (id: string): Promise<StoredVolunteer | null> => {
        const r = await this.prisma.volunteer.findUnique({ where: { id } });
        return r ? this.mapVolunteer(r) : null;
      },

      findByResetToken: async (token: string): Promise<StoredVolunteer | null> => {
        const r = await this.prisma.volunteer.findFirst({
          where: { passwordResetToken: token },
        });
        return r ? this.mapVolunteer(r) : null;
      },

      listByAssociation: async (associationId: string): Promise<StoredVolunteer[]> => {
        const rows = await this.prisma.volunteer.findMany({
          where: { associationId },
          orderBy: { name: 'asc' },
        });
        return rows.map((r: any) => this.mapVolunteer(r));
      },

      create: async (data: CreateVolunteerInput): Promise<StoredVolunteer> => {
        const r = await this.prisma.volunteer.create({ data });
        return this.mapVolunteer(r);
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredVolunteer, 'id' | 'associationId' | 'createdAt'>>
      ): Promise<StoredVolunteer> => {
        const r = await this.prisma.volunteer.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapVolunteer(r);
      },
    };
  }

  // ── TicketBaiConfigRepository ──────────────────────────────────────────────

  get ticketBaiConfig(): TicketBaiConfigRepository {
    return {
      findByAssociation: async (associationId: string): Promise<StoredTicketBaiConfig | null> => {
        const r = await this.prisma.ticketBaiConfig.findUnique({ where: { associationId } });
        return r ? this.mapTicketBaiConfig(r) : null;
      },

      upsert: async (
        associationId: string,
        data: Partial<Omit<StoredTicketBaiConfig, 'id' | 'associationId' | 'createdAt'>>
      ): Promise<StoredTicketBaiConfig> => {
        const credentialsJson =
          data.credentials !== undefined ? JSON.stringify(data.credentials) : undefined;
        const r = await this.prisma.ticketBaiConfig.upsert({
          where: { associationId },
          create: {
            associationId,
            providerType: data.providerType ?? 'MOCK',
            territory: data.territory ?? null,
            series: data.series ?? 'TB',
            credentials: credentialsJson ?? '{}',
          },
          update: {
            ...(data.providerType !== undefined && { providerType: data.providerType }),
            ...(data.territory !== undefined && { territory: data.territory }),
            ...(data.series !== undefined && { series: data.series }),
            ...(credentialsJson !== undefined && { credentials: credentialsJson }),
            updatedAt: new Date(),
          },
        });
        return this.mapTicketBaiConfig(r);
      },
    };
  }

  // ── TicketBaiInvoiceRepository ─────────────────────────────────────────────

  get ticketBaiInvoices(): TicketBaiInvoiceRepository {
    return {
      create: async (
        data: Omit<StoredTicketBaiInvoice, 'id' | 'createdAt' | 'updatedAt'>
      ): Promise<StoredTicketBaiInvoice> => {
        const r = await this.prisma.ticketBaiInvoice.create({
          data: {
            associationId: data.associationId,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            series: data.series,
            invoiceNumber: data.invoiceNumber,
            issuedAt: data.issuedAt,
            sellerName: data.sellerName,
            sellerCif: data.sellerCif,
            linesJson: JSON.stringify(data.lines),
            total: data.total,
            vatJson: JSON.stringify(data.vatBreakdown),
            chainId: data.chainId,
            providerRef: data.providerRef ?? null,
            qrUrl: data.qrUrl ?? null,
            xmlPayload: data.xmlPayload ?? null,
            status: data.status,
          },
        });
        return this.mapTicketBaiInvoice(r);
      },

      findByOrder: async (orderId: string): Promise<StoredTicketBaiInvoice | null> => {
        const r = await this.prisma.ticketBaiInvoice.findFirst({ where: { orderId } });
        return r ? this.mapTicketBaiInvoice(r) : null;
      },

      findById: async (id: string): Promise<StoredTicketBaiInvoice | null> => {
        const r = await this.prisma.ticketBaiInvoice.findUnique({ where: { id } });
        return r ? this.mapTicketBaiInvoice(r) : null;
      },

      listByAssociation: async (associationId: string): Promise<StoredTicketBaiInvoice[]> => {
        const rows = await this.prisma.ticketBaiInvoice.findMany({
          where: { associationId },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r: any) => this.mapTicketBaiInvoice(r));
      },

      getLastByAssociation: async (
        associationId: string,
        series: string
      ): Promise<StoredTicketBaiInvoice | null> => {
        const r = await this.prisma.ticketBaiInvoice.findFirst({
          where: { associationId, series },
          orderBy: { invoiceNumber: 'desc' },
        });
        return r ? this.mapTicketBaiInvoice(r) : null;
      },

      nextInvoiceNumber: async (associationId: string, series: string): Promise<number> => {
        const last = await this.prisma.ticketBaiInvoice.findFirst({
          where: { associationId, series },
          orderBy: { invoiceNumber: 'desc' },
          select: { invoiceNumber: true },
        });
        return (last?.invoiceNumber ?? 0) + 1;
      },
    };
  }

  // ── PaymentProviderRepository ──────────────────────────────────────────────

  get paymentProviders(): PaymentProviderRepository {
    return {
      listByAssociation: async (associationId: string): Promise<StoredPaymentProvider[]> => {
        const rows = await this.prisma.paymentProvider.findMany({
          where: { associationId },
          orderBy: { createdAt: 'asc' },
        });
        return rows.map((r: any) => this.mapPaymentProvider(r));
      },

      findById: async (id: string): Promise<StoredPaymentProvider | null> => {
        const r = await this.prisma.paymentProvider.findUnique({ where: { id } });
        return r ? this.mapPaymentProvider(r) : null;
      },

      create: async (data: CreatePaymentProviderInput): Promise<StoredPaymentProvider> => {
        const r = await this.prisma.paymentProvider.create({
          data: {
            associationId: data.associationId,
            providerType: data.providerType,
            displayName: data.displayName ?? null,
            testMode: data.testMode,
            credentials: JSON.stringify(data.credentials),
            bizumEnabled: data.bizumEnabled ?? false,
            enabled: true,
          },
        });
        return this.mapPaymentProvider(r);
      },

      update: async (
        id: string,
        patch: Partial<Omit<StoredPaymentProvider, 'id' | 'associationId' | 'createdAt'>>
      ): Promise<StoredPaymentProvider> => {
        const dbPatch: any = { ...patch, updatedAt: new Date() };
        if (patch.credentials !== undefined) {
          dbPatch.credentials = JSON.stringify(patch.credentials);
        }
        const r = await this.prisma.paymentProvider.update({ where: { id }, data: dbPatch });
        return this.mapPaymentProvider(r);
      },

      delete: async (id: string): Promise<void> => {
        await this.prisma.paymentProvider.delete({ where: { id } });
      },
    };
  }

  // ── VatTypeRepository ──────────────────────────────────────────────────────

  get vatTypes(): VatTypeRepository {
    return {
      list: async (associationId: string): Promise<StoredVatType[]> => {
        const rows = await this.prisma.vatType.findMany({
          where: { associationId },
          orderBy: { percentage: 'asc' },
        });
        return rows.map((r: any) => this.mapVatType(r));
      },

      findById: async (id: string): Promise<StoredVatType | null> => {
        const r = await this.prisma.vatType.findUnique({ where: { id } });
        return r ? this.mapVatType(r) : null;
      },

      findByLabel: async (associationId: string, label: string): Promise<StoredVatType | null> => {
        const r = await this.prisma.vatType.findFirst({ where: { associationId, label } });
        return r ? this.mapVatType(r) : null;
      },

      create: async (data: {
        associationId: string;
        label: string;
        percentage: number;
      }): Promise<StoredVatType> => {
        const r = await this.prisma.vatType.create({ data });
        return this.mapVatType(r);
      },

      update: async (
        id: string,
        patch: { label?: string; percentage?: number }
      ): Promise<StoredVatType> => {
        const r = await this.prisma.vatType.update({
          where: { id },
          data: { ...patch, updatedAt: new Date() },
        });
        return this.mapVatType(r);
      },

      delete: async (id: string): Promise<void> => {
        await this.prisma.vatType.delete({ where: { id } });
      },

      countProducts: async (vatTypeId: string): Promise<number> => {
        return this.prisma.product.count({ where: { vatTypeId } });
      },
    };
  }
}
