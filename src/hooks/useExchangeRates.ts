import { useQuery } from "@tanstack/react-query";

interface ExchangeRate {
  code: string;
  name: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  pctChange: number;
  timestamp: string;
}

interface ExchangeRates {
  usd: ExchangeRate | null;
  eur: ExchangeRate | null;
  gbp: ExchangeRate | null;
  isLoading: boolean;
  isError: boolean;
}

const fetchRates = async (): Promise<{ usd: ExchangeRate; eur: ExchangeRate; gbp: ExchangeRate }> => {
  const res = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL");
  if (!res.ok) throw new Error("Falha ao buscar cotações");
  const data = await res.json();

  const parse = (raw: any): ExchangeRate => ({
    code: raw.code,
    name: raw.name,
    bid: parseFloat(raw.bid),
    ask: parseFloat(raw.ask),
    high: parseFloat(raw.high),
    low: parseFloat(raw.low),
    pctChange: parseFloat(raw.pctChange),
    timestamp: raw.create_date,
  });

  return {
    usd: parse(data.USDBRL),
    eur: parse(data.EURBRL),
    gbp: parse(data.GBPBRL),
  };
};

export const useExchangeRates = (): ExchangeRates => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: fetchRates,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return {
    usd: data?.usd ?? null,
    eur: data?.eur ?? null,
    gbp: data?.gbp ?? null,
    isLoading,
    isError,
  };
};
