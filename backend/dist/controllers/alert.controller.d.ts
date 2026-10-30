import { Request, Response } from "express";
export declare const getAllAlerts: (req: Request, res: Response) => Promise<void>;
export declare const getAlertById: (req: Request, res: Response) => Promise<void>;
export declare const getAlertsBySeverity: (req: Request, res: Response) => Promise<void>;
export declare const deleteAlert: (req: Request, res: Response) => Promise<void>;
export declare const getAlertStatistics: (req: Request, res: Response) => Promise<void>;
