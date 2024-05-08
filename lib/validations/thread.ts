import * as z from 'zod'

export const ThreadValidation = z.object({
    thread: z.string().min(3, {message: 'Thread must be at least 3 characters long'}).max(1000, {message: 'Thread must be less than 1000 characters long'}),
    accountId: z.string(),
})

export const CommentValidation = z.object({
    thread: z.string().min(3, {message: 'Thread must be at least 3 characters long'}).max(1000, {message: 'Thread must be less than 1000 characters long'}),
})