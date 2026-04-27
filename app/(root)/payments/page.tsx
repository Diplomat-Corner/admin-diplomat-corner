"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInfoEditButton } from "@/components/admin/payment-info-edit-dialog";
import {
  PaymentsTable,
  type Payment as TablePayment,
} from "@/components/admin/payments-table";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PaymentsPage() {
  // Define interface for API response data
  interface PaymentData {
    _id?: string;
    id?: string;
    paymentId?: string;
    servicePrice: number;
    receiptUrl?: string;
    productId?: string;
    productType: "house" | "car";
    userId: string;
    uploadedAt: string;
  }

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/payment");
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : data.payments || []);
      } catch (e) {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Analytics
  const totalPayments = payments.length;
  const totalServiceCharge = payments.reduce(
    (sum, p) => sum + (p.servicePrice || 0),
    0
  );
  const housePayments = payments.filter((p) => p.productType === "house");
  const carPayments = payments.filter((p) => p.productType === "car");
  const houseCount = housePayments.length;
  const carCount = carPayments.length;
  const housePercent = totalPayments
    ? ((houseCount / totalPayments) * 100).toFixed(1)
    : 0;
  const carPercent = totalPayments
    ? ((carCount / totalPayments) * 100).toFixed(1)
    : 0;
  const mostRecent = payments.length
    ? new Date(
        Math.max(...payments.map((p) => new Date(p.uploadedAt).getTime()))
      )
    : null;
  const uniqueUsers = new Set(payments.map((p) => p.userId)).size;
  const avgServiceCharge = totalPayments
    ? (totalServiceCharge / totalPayments).toFixed(2)
    : 0;

  // Prepare data for the last 12 months
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return d;
  });
  const monthLabels = months.map((d) =>
    d.toLocaleString("default", { month: "short", year: "2-digit" })
  );
  const paymentsByMonth = months.map((month, idx) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const count = payments.filter((p) => {
      const date = new Date(p.uploadedAt);
      return date >= month && date < nextMonth;
    }).length;
    const house = payments.filter((p) => {
      const date = new Date(p.uploadedAt);
      return p.productType === "house" && date >= month && date < nextMonth;
    }).length;
    const car = payments.filter((p) => {
      const date = new Date(p.uploadedAt);
      return p.productType === "car" && date >= month && date < nextMonth;
    }).length;
    return {
      month: monthLabels[idx],
      total: count,
      house,
      car,
    };
  });

  const chartConfig = {
    total: { label: "Total", color: "#16a34a" },
    house: { label: "House", color: "#2563eb" },
    car: { label: "Car", color: "#f59e42" },
  };

  // Transform data to match the TablePayment type
  const tableData: TablePayment[] = payments.map((payment) => ({
    _id: payment._id || payment.id || "",
    paymentId: payment.paymentId === "0" ? "3000" : payment.paymentId || "3000",
    servicePrice: payment.servicePrice,
    receiptUrl: payment.receiptUrl || "",
    uploadedAt: payment.uploadedAt,
    productId: payment.productId || "",
    productType: payment.productType,
    userId: payment.userId,
  }));

  return (
    <div className="main-content space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
          Payments Analytics
        </h1>
        <div className="shrink-0 self-end sm:self-start">
          <PaymentInfoEditButton />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Service Charge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServiceCharge} Birr</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              House Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{houseCount}</div>
            <div className="text-xs text-muted-foreground">
              {housePercent}% of total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Car Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carCount}</div>
            <div className="text-xs text-muted-foreground">
              {carPercent}% of total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Most Recent Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostRecent ? mostRecent.toLocaleDateString() : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Service Charge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgServiceCharge} Birr</div>
          </CardContent>
        </Card>
      </div>
      <div className="bg-white rounded-lg shadow p-4 mt-8">
        <h2 className="text-lg font-semibold mb-2">Payments Per Month</h2>
        <ChartContainer config={chartConfig} className="w-full h-[320px]">
          <BarChart
            data={paymentsByMonth}
            margin={{ top: 30, right: 30, bottom: 50, left: 50 }}
          >
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="total" fill={chartConfig.total.color} name="Total" />
            <Bar dataKey="house" fill={chartConfig.house.color} name="House" />
            <Bar dataKey="car" fill={chartConfig.car.color} name="Car" />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="mt-8">
        <PaymentsTable data={tableData} loading={loading} />
      </div>
    </div>
  );
}
