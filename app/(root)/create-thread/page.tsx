import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import PostThread from "@/components/forms/PostThread";
import { fetchUserData } from "@/lib/actions/user.actions";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUserData(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className='head-text'>Create Thread</h1>

      <PostThread userId={userInfo._id} />
    </>
  );
}

export default Page;