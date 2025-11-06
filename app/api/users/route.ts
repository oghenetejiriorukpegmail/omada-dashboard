import { NextRequest, NextResponse } from 'next/server';
import { createOmadaClient } from '@/lib/omada-api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password, portals, siteId, checkoutDate } = body;

    if (!userName || !password || !portals || portals.length === 0) {
      return NextResponse.json(
        { error: 'Username, password, and at least one portal are required' },
        { status: 400 }
      );
    }

    if (typeof userName !== 'string' || userName.length < 1 || userName.length > 32) {
      return NextResponse.json(
        { error: 'Room number must be between 1 and 32 characters' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 3) {
      return NextResponse.json(
        { error: 'Guest last name must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(userName)) {
      return NextResponse.json(
        { error: 'Room number can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      );
    }

    const client = createOmadaClient(!siteId);

    // Calculate expiration time
    let expirationTime: number;
    if (checkoutDate) {
      // Use provided checkout date/time
      expirationTime = new Date(checkoutDate).getTime();

      // Validate checkout date is in the future
      if (expirationTime <= Date.now()) {
        return NextResponse.json(
          { error: 'Checkout date must be in the future' },
          { status: 400 }
        );
      }
    } else {
      // Default to 30 days from now
      expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }

    const userData = {
      userName,
      password,
      enable: true,
      expirationTime,
      bindingType: 0,
      maxUsers: 10,
      rateLimit: {
        mode: 0,
        customRateLimit: {
          downLimitEnable: false,
          downLimit: 0,
          upLimitEnable: false,
          upLimit: 0,
        },
      },
      trafficLimitEnable: false,
      trafficLimit: 0,
      trafficLimitFrequency: 0,
      portals,
      applyToAllPortals: false,
      dailyLimitEnable: false,
      dailyLimit: {
        authTimeout: 1, // 30 Minutes preset (won't be enforced since dailyLimitEnable is false)
        customTimeout: 30,
        customTimeoutUnit: 1,
      },
    };

    logger.info('Creating user', {
      userName,
      portalCount: portals.length,
      siteId: siteId || 'default',
      expirationDate: new Date(expirationTime).toISOString(),
      checkoutProvided: !!checkoutDate
    });

    const result = await client.createLocalUser(userData, siteId || undefined);

    logger.info('User created successfully', {
      userName,
      portalCount: portals.length,
      siteId: siteId || 'default',
      expirationDate: new Date(expirationTime).toISOString(),
      checkoutProvided: !!checkoutDate
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error('Error creating user', error, { endpoint: '/api/users' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, siteId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const client = createOmadaClient(!siteId);

    logger.info('Deleting user', {
      userId,
      siteId: siteId || 'default'
    });

    await client.deleteLocalUser(userId, siteId || undefined);

    logger.info('User deleted successfully', {
      userId,
      siteId: siteId || 'default'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting user', error, { endpoint: '/api/users' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
