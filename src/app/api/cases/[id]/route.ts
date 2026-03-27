import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const dentalCase = await db.dentalCase.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: [{ jaw: 'asc' }, { stepNumber: 'asc' }]
        },
        comments: {
          orderBy: { timestamp: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        media: true,
        teeth: true
      }
    });
    
    if (!dentalCase) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, case: dentalCase });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch case' }, { status: 500 });
  }
}

// PUT - Update case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { patientName, status, version } = body;
    
    const updateData: Record<string, unknown> = {};
    if (patientName) updateData.patientName = patientName;
    if (status) updateData.status = status;
    if (version) updateData.version = version;
    
    const updatedCase = await db.dentalCase.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ success: false, error: 'Failed to update case' }, { status: 500 });
  }
}

// DELETE - Delete case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.dentalCase.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete case' }, { status: 500 });
  }
}
