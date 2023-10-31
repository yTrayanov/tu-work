export const badRequestResponse = (res: any, body: object) => {
    return res.status(400).json(body);
};

export const okResponse = (res: any, data: object) => {
    return res.status(200).json(data);
};

export const internalServerErrorResponse = (res: any, error: any) => {
    return res.status(500).json(error);
};

export const unauthorized = (res: any, data: object) => {
    return res.status(401).json(data);
};
