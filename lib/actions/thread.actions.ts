'use server'

import { revalidatePath } from "next/cache"
import Thread from "../models/thread.models"
import User from "../models/user.models"
import { connectDB } from "../mongoose"
import path from "path"
import { text } from "stream/consumers"

interface Params{
    text: string, author:string, communityId: string, path: string
}

export async function createThread({text, author, communityId, path}: Params) {
    try{
        connectDB()

        const createdThread = await Thread.create({text, author, community:null})

        await User.findByIdAndUpdate(author, {$push: {threads: createdThread._id}})

        revalidatePath(path)
    }
    catch(err){
        console.log(err)
    }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    try{
        connectDB()

        const skipAmount = (pageNumber - 1) * pageSize

        // fetch top level posts as others are basically comments
        const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    // .populate({
    //   path: "community",
    //   model: Community,
    // })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });
    
        const totalPostsCount = await Thread.countDocuments({parentId:{$in: [null, undefined]}})

        const posts = await postsQuery.exec()

        const isNext = totalPostsCount > skipAmount + posts.length

        return {posts, isNext}
    }catch(err){
        console.log(err)
    }


}

export async function fetchThreadById(threadId: string) {
    connectDB()
    try{
        const thread = await Thread.findById(threadId)
            .populate({
                path: 'author',
                model: User,
                select: '_id name id image'
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User, 
                        select: '_id name id image parentId'
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: [
                            {
                                path: 'author',
                                model: User, 
                                select: '_id name id image parentId'
                            }
                        ]
                    }
                ]
            }).exec()

            return thread
    }catch(err: any){
        console.log(`Error fetching thread ${err.message}`);
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });
  
    const descendantThreads = [];
    for (const childThread of childThreads) {
      const descendants = await fetchAllChildThreads(childThread._id);
      descendantThreads.push(childThread, ...descendants);
    }
  
    return descendantThreads;
  }

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
){
    connectDB()

    try{
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) {
        throw new Error("Thread not found");
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId, 
        });

        const savedCommentThread = await commentThread.save();

        originalThread.children.push(savedCommentThread._id);

        await originalThread.save();

        revalidatePath(path);
    }catch(err: any){
        console.log(`Error adding comment to thread: ${err.message}`);
    }
}

export async function deleteThread(id: string, path: string): Promise<void> {
    try {
        connectDB();
    
        const mainThread = await Thread.findById(id).populate("author");
    
        if (!mainThread) {
          throw new Error("Thread not found");
        }
    
        const descendantThreads = await fetchAllChildThreads(id);
    
        const descendantThreadIds = [
          id,
          ...descendantThreads.map((thread) => thread._id),
        ];
    
        const uniqueAuthorIds = new Set(
          [
            ...descendantThreads.map((thread) => thread.author?._id?.toString()), 
            mainThread.author?._id?.toString(),
          ].filter((id) => id !== undefined)
        );
    
        await Thread.deleteMany({ _id: { $in: descendantThreadIds } });
    
        await User.updateMany(
          { _id: { $in: Array.from(uniqueAuthorIds) } },
          { $pull: { threads: { $in: descendantThreadIds } } }
        );
    
        revalidatePath(path);
      } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`);
      }
}