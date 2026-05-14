export enum KycStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

export enum Currency {
    BTC = "BTC",
    ETH = "ETH", 
    USDT = "USDT",
    INR = "INR"
}

export enum TradingPair {
    BTC_USDT = "BTC_USDT",
    ETH_USDT = "ETH_USDT",
    BTC_INR = "BTC_INR",
    ETH_INR = "ETH_INR"
}

export enum OrderSide {
    BUY = "BUY",
    SELL = "SELL"
}

export enum OrderType {
    LIMIT = "LIMIT",
    MARKET = "MARKET",
}

export enum OrderStatus {
    OPEN = "OPEN",
    PARTIAL = "PARTIAL",
    FILLED = "FILLED",
    CANCELLED = "CANCELLED"
}

export enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL"
}

export enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export enum OhlcvInterval {
    ONE_MIN = "1m",
    FIVE_MIN = "5m",
    FIFTEEN_MIN = "15m",
    ONE_HR = "1h",
    ONE_DAY = "1d"
}