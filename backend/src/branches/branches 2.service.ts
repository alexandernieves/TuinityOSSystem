import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/request-context';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantId() {
    const store = RequestContext.getStore();
    const tenantId = store?.tenantId;
    if (!tenantId) {
      throw new Error('Missing tenantId in request context');
    }
    return tenantId;
  }

  async listForTenant() {
    const tenantId = this.getTenantId();
    return this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tenantId = this.getTenantId();
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const tenantId = this.getTenantId();

    // Check if code already exists for this tenant
    const existing = await this.prisma.branch.findUnique({
      where: {
        tenantId_code: { tenantId, code: dto.code },
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una sucursal con ese código.');
    }

    return this.prisma.branch.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async update(id: string, dto: UpdateBranchDto) {
    const tenantId = this.getTenantId();

    const branch = await this.findOne(id);

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.prisma.branch.findUnique({
        where: {
          tenantId_code: { tenantId, code: dto.code },
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Ya existe otra sucursal con el código solicitado.',
        );
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    // Before deleting, we might want to check if it has transactions,
    // but for now we'll allow it if the DB constraints allow.
    try {
      return await this.prisma.branch.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException(
        'No se puede eliminar la sucursal porque tiene registros asociados.',
      );
    }
  }
}
