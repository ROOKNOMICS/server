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

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token, access denied' });
            return;
        }
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
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