import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: string;
}

export const protect = (
    req: Request,
    res: Response,
    next: NextFunction
): any => {
    try {
        const cookieToken = req.cookies?.token;
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : undefined;
        const token = cookieToken || bearerToken;

    if (!token) {
      res.status(401).json({ message: 'No token, access denied' });
      return;
    }

    
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as jwt.JwtPayload;

        (req as any).userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalid or expired' });
    }
};
