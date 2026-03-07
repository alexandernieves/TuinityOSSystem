import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { StockService } from '../stock/stock.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private stockService: StockService,
    ) { }

    async findAll(): Promise<any[]> {
        const products = await this.productModel.find().exec();
        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const stock = await this.stockService.getProductStockAggregate(product._id.toString());
                return {
                    ...product.toObject(),
                    stock,
                };
            }),
        );
        return productsWithStock;
    }

    async findOne(id: string): Promise<ProductDocument> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async findByReference(reference: string): Promise<ProductDocument> {
        const product = await this.productModel.findOne({ reference }).exec();
        if (!product) {
            throw new NotFoundException(`Product with reference ${reference} not found`);
        }
        return product;
    }

    async create(createProductDto: any): Promise<ProductDocument> {
        const newProduct = new this.productModel(createProductDto);
        return newProduct.save();
    }

    async update(id: string, updateProductDto: any): Promise<ProductDocument> {
        const updatedProduct = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();
        if (!updatedProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return updatedProduct;
    }

    async remove(id: string): Promise<any> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return result;
    }
}
