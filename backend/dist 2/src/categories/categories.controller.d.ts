import { CategoriesService } from './categories.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { CategoryQueryDto } from './dto/category-query.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    private getContext;
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        deletedAt: Date | null;
        parentId: string | null;
    }>;
    findAll(query: CategoryQueryDto): Promise<{
        items: ({
            _count: {
                products: number;
            };
            parent: {
                id: string;
                name: string;
            } | null;
            children: {
                id: string;
                name: string;
                _count: {
                    products: number;
                };
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string | null;
            deletedAt: Date | null;
            parentId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            products: number;
        };
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string | null;
            deletedAt: Date | null;
            parentId: string | null;
        } | null;
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            description: string | null;
            deletedAt: Date | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        deletedAt: Date | null;
        parentId: string | null;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        deletedAt: Date | null;
        parentId: string | null;
    }>;
    remove(id: string): Promise<void>;
}
