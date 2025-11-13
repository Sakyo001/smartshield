import {NextRequest, NextResponse} from 'next/server';
import getSession from '@lib/auth';

export async function proxy(request: NextRequest){
  const session = await getSession(request);

    if(!session){
    return NextResponse.redirect('/login');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path", "/admin/:path"],
}