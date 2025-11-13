import {NextRequest, NextResponse} from 'next/server';
import { getToken } from "next-auth/jwt"


export async function proxy(request: NextRequest){
  const token = await getToken({ req:request })
  const url = new URL(request.url);

  if (url.pathname === "/dashboard"){
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    } 
    return NextResponse.redirect(
      new URL(`dashboard/${token.id}`, request.url)
    )
  }


  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/admin"],
}