import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksService } from '@/lib/qb-service';

export async function GET(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user'; // TODO: Replace with a user ID from session or context
        await qbService.initialize(userId);
        const companyName = await qbService.getCompanyName();

        return NextResponse.json({
            success: true,
            companyName: companyName
        });
    } catch (err: any) {
        console.error('Get company name failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}