import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './services/cart.service';
import { CartController } from './cart.controller';
import { CartItemEntity } from './models/cart-item.entity';
import { OrderModule } from 'src/order/order.module';
import { CartEntity } from './models/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartEntity, CartItemEntity]), OrderModule],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}