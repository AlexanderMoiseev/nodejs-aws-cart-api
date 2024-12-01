import { Controller, Get, Delete, Put, Body, Req, Post, UseGuards, HttpStatus, ValidationPipe } from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('api/profile/cart')
export class CartController {

  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) { }
  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest) {
    try {
      const userReq = getUserIdFromRequest(req);
      console.log('userReq', userReq);
      const cart = await this.cartService.findOrCreateByUserId(
        getUserIdFromRequest(req),
      );
      const cartItems = await this.cartService.findItemsByCartId(cart.id);
      console.log('cart', cart);
      const result = {
        statusCode: HttpStatus.OK,
        message: 'OKGet',
        data: {
          cart: {
            ...cart,
            items: cartItems,
          }
        },
      };
      console.log('cartResult', result);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body(new ValidationPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    updateCartDto: UpdateCartDto,
  ) {
    try {
      const cart = await this.cartService.updateByUserId(
        getUserIdFromRequest(req),
        updateCartDto,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: {
          cart,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Delete()
  async clearUserCart(@Req() req: AppRequest) {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Post('checkout')
  async checkout(@Req() req: AppRequest, @Body() body) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: 'Cart is empty',
      };
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(cart);
    const order = this.orderService.create({
      ...body, // TODO: validate and pick only necessary data
      userId,
      cartId,
      items,
      total,
    });
    this.cartService.removeByUserId(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order },
    };
  }
}
