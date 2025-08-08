// app/api/quickbooks/company/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksService } from '@/lib/qb-service';

export async function GET(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user';

        await qbService.initialize(userId);
        const companyName = await qbService.getCompanyName();

        return NextResponse.json({
            success: true,
            companyName: companyName
        });
    } catch (error: any) {
        console.error('Get company name failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}