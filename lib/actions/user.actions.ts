"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.models"
import { connectDB } from "../mongoose"
import Thread from "../models/thread.models"
import {Regex} from "lucide-react";
import {search} from "effect/String";
import {FilterQuery, SortOrder} from "mongoose";
import {TypeOf} from "zod";

interface Params{
    userId: string
    username: string
    name: string
    image: string
    bio: string
    path: string
}

export async function updateUser({userId, username, name, image, bio, path} : Params): Promise<void>{
    connectDB()

    try{
        await User.findOneAndUpdate({id: userId}, {
            username: username.toLowerCase(),
            name,
            image,
            bio,
            onboarded: true,
        },
        {upsert: true}
        )

        if(path === '/profile/edit'){
            revalidatePath(path)
        }
    }catch(err: any){
        console.log(`Failed to create/update user: ${err.message}`);
        
    }

}

export async function fetchUserData(userId: string){
    try{
        connectDB()

        return await User
            .findOne({id: userId})
            // .populate({path: 'communities', model: Community}) 
    }
    catch(err: any){
        console.log(`Failed to fetch user data: ${err.message}`);
        
    }
}

export async function fetchUserThreads(userId: string) {
    try {
        connectDB()

        const threads = await User.findOne({id: userId})
            .populate({
                path: 'threads', 
                model: Thread,
                populate:{
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name id image'
                    }
                }
            })

            return threads
    } catch (error: any) {
        console.log(`Failed to fetch user posts: ${error.message}`);
    }
}

export async function fetchUsers({
    userId,
    searchString = '',
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'desc'
}:{
    userId: string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}){
    try{
        connectDB()

        const skipAmount = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString, 'i')

        const query: FilterQuery<typeof User> = {
            id: {$ne: userId},
        }

        if(searchString.trim() !== ''){
            query.$or = [
                {username:{$regex: regex}},
                {name:{$regex: regex}},
            ]
        }

        const sortOptions = {createdAt: sortBy}

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)

        const totalUserCount = await User.countDocuments(query)
        const users = await usersQuery.exec()
        const isNext = totalUserCount > skipAmount + users.length

        return {users, isNext}
    }catch (err: any){
        throw new Error(`Failed to fetch users: ${err.message}`);
    }
}

export async function getActivity(userId: string){
    try{
        connectDB()

        const userThreads = await Thread.find({author: userId})
        const childThreadIds = userThreads.reduce((acc, userThread) => acc.concat(userThread.children), [])

        const replies = await Thread.find({
            id: {$in: childThreadIds},
            author: {$ne: userId}
        }).populate({
            path: 'author',
            model: User,
            select: '_id name image'
        })

        return replies
    }catch (err: any){
        throw new Error(`Failed to get activity: ${err.message}`);
    }
}