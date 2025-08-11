import { NextRequest, NextResponse } from 'next/server';
import { QuickBooksService } from '@/lib/qb-service';

export async function GET(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user'; // TODO: Replace with a user ID from session or context
        await qbService.initialize(userId);

        const url = new URL(req.url);
        const invoiceId = url.searchParams.get('id');
        const criteria = url.searchParams.get('criteria');

        // If invoiceId is provided, get specific invoice
        if (invoiceId) {
            const invoice = await qbService.getInvoice(invoiceId);
            return NextResponse.json({
                success: true,
                invoice: invoice
            });
        }

        // Otherwise, get all invoices or filter by criteria
        const invoices = await qbService.findInvoices(criteria || undefined);
        return NextResponse.json({
            success: true,
            invoices: invoices
        });

    } catch (err: any) {
        console.error('Get invoice failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user'; // TODO: Replace with a user ID from session or context
        await qbService.initialize(userId);

        const invoiceData = await req.json();
        const invoice = await qbService.createInvoice(invoiceData);

        return NextResponse.json({
            success: true,
            invoice: invoice
        });

    } catch (err: any) {
        console.error('Create invoice failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user'; // TODO: Replace with a user ID from session or context
        await qbService.initialize(userId);

        const invoiceData = await req.json();
        const invoice = await qbService.updateInvoice(invoiceData);

        return NextResponse.json({
            success: true,
            invoice: invoice
        });

    } catch (err: any) {
        console.error('Update invoice failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const qbService = new QuickBooksService();
        const userId = 'default_user'; // TODO: Replace with a user ID from session or context
        await qbService.initialize(userId);

        const url = new URL(req.url);
        const invoiceId = url.searchParams.get('id');

        if (!invoiceId) {
            return NextResponse.json({
                success: false,
                error: 'Invoice ID is required for deletion'
            }, { status: 400 });
        }

        const result = await qbService.deleteInvoice(invoiceId);

        return NextResponse.json({
            success: true,
            result: result
        });

    } catch (err: any) {
        console.error('Delete invoice failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}