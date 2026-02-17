import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import {
  createBranchSchema,
  updateBranchSchema,
  CreateBranchDto,
  UpdateBranchDto,
} from './dto/branch.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions(PermissionKey.VIEW_BRANCHES || 'view:branches')
  findAll() {
    return this.branchesService.listForTenant();
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.VIEW_BRANCHES || 'view:branches')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PermissionKey.MANAGE_BRANCHES || 'manage:branches')
  @UsePipes(new ZodValidationPipe(createBranchSchema))
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.MANAGE_BRANCHES || 'manage:branches')
  @UsePipes(new ZodValidationPipe(updateBranchSchema))
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.MANAGE_BRANCHES || 'manage:branches')
  remove(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }
}
