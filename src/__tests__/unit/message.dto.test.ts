import { validate } from 'class-validator';
import { MessageRequestBodyDto, MessageRequestParamsDto } from '../../dto/message.dto.ts';

describe('Message DTOs', () => {
    describe('MessageRequestParamsDto', () => {
        it('should validate valid botId', async () => {
            const dto = new MessageRequestParamsDto();
            dto.botId = 'valid-bot-id';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation for empty botId', async () => {
            const dto = new MessageRequestParamsDto();
            dto.botId = '';

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('botId');
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation for non-string botId', async () => {
            const dto = new MessageRequestParamsDto();
            (dto as any).botId = 123;

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('botId');
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('MessageRequestBodyDto', () => {
        it('should validate valid message body', async () => {
            const dto = new MessageRequestBodyDto();
            dto.content = 'Hello, bot!';
            dto.thread_id = 'thread-123';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation for empty content', async () => {
            const dto = new MessageRequestBodyDto();
            dto.content = '';
            dto.thread_id = 'thread-123';

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation for empty thread_id', async () => {
            const dto = new MessageRequestBodyDto();
            dto.content = 'Hello, bot!';
            dto.thread_id = '';

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('thread_id');
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation for non-string content', async () => {
            const dto = new MessageRequestBodyDto();
            (dto as any).content = 123;
            dto.thread_id = 'thread-123';

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('content');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation for non-string thread_id', async () => {
            const dto = new MessageRequestBodyDto();
            dto.content = 'Hello, bot!';
            (dto as any).thread_id = 123;

            const errors = await validate(dto);
            expect(errors.length).toBe(1);
            expect(errors[0].property).toBe('thread_id');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation for missing both fields', async () => {
            const dto = new MessageRequestBodyDto();
            dto.content = '';
            dto.thread_id = '';

            const errors = await validate(dto);
            expect(errors.length).toBe(2);
            expect(errors.map((e) => e.property)).toContain('content');
            expect(errors.map((e) => e.property)).toContain('thread_id');
        });
    });
});
