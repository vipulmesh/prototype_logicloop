import {NextResponse} from 'next/server';import {candidates} from '@/lib/data';export async function GET(){return NextResponse.json({data:candidates,total:candidates.length})}
