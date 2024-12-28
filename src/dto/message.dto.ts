import { IsNotEmpty, IsString } from 'class-validator';

export class MessageRequestParamsDto {
    @IsString()
    @IsNotEmpty()
    botId: string = '';
}

export class MessageRequestBodyDto {
    @IsString()
    @IsNotEmpty()
    content: string = '';

    @IsString()
    @IsNotEmpty()
    thread_id: string = '';
}
