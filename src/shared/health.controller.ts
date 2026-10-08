import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './guards/decorators';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica se a API está no ar' })
  verificar() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
