import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(userData: any): Promise<UserDocument> {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = new this.userModel({
            ...userData,
            password: hashedPassword,
        });
        return newUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().select('-password').exec();
    }

    async update(id: string, updateData: any): Promise<UserDocument | null> {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password; // Do not update if empty
        }
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
    }

    async toggleActive(id: string, isActive: boolean): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password').exec();
    }
}
