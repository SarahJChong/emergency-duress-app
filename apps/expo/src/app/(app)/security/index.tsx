import React, { useMemo } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/utils/formatDate";
import BlinkingDot from "@/components/BlinkingDot";
import Button from "@/components/Button";
import { FormSelectField } from "@/components/FormField";
import Loading from "@/components/Loading";
import type { SelectOption } from "@/components/Select/types";
import { useAuth } from "@/hooks/useAuth";
import { useLocationsQuery } from "@/hooks/useLocationsQueries";
import { useMeQuery } from "@/hooks/useQueries";
import useSecurityIncidents from "@/hooks/useSecurityIncidents";
import { type ApiIncident } from "@/lib/api";

type IncidentStatus = ApiIncident["status"];

export default function IncidentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isSignedIn, user } = useAuth();
  const userQuery = useMeQuery(isSignedIn);
  const [locationId, setLocationId] = React.useState<string | null>("");
  const [status, setStatus] = React.useState<string | null>("Open");
  const [dateFilter, setDateFilter] = React.useState<string | null>("");
  const [sortOption, setSortOption] = React.useState<string>("date_desc");

  const DATE_OPTIONS: SelectOption[] = [
    { label: t("security.date_options.all_time"), value: "" },
    { label: t("security.date_options.last_24h"), value: "24h" },
    { label: t("security.date_options.last_7d"), value: "7d" },
    { label: t("security.date_options.last_30d"), value: "30d" },
  ];

  const STATUS_OPTIONS: SelectOption[] = [
    { label: t("security.filters.all_statuses"), value: "" },
    { label: t("security.status.open"), value: "Open" },
    { label: t("security.status.closed"), value: "Closed" },
    { label: t("security.status.cancelled"), value: "Cancelled" },
  ];

  const SORT_OPTIONS: SelectOption[] = [
    { label: t("security.sort_options.date_recent"), value: "date_desc" },
    { label: t("security.sort_options.date_oldest"), value: "date_asc" },
    { label: t("security.sort_options.status_asc"), value: "status_asc" },
    { label: t("security.sort_options.status_desc"), value: "status_desc" },
  ];

  const STATUS_COLORS: Record<IncidentStatus, string> = {
    Open: "text-red-600",
    Closed: "text-green-600",
    Cancelled: "text-gray-600",
  };

  const { data: locationsData } = useLocationsQuery();

  const locationOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [
      { label: t("security.filters.all_locations"), value: "" },
    ];
    if (locationsData) {
      options.push(
        ...locationsData.map((loc) => ({
          label: loc.name,
          value: loc.id,
        })),
      );
    }
    return options;
  }, [locationsData, t]);

  const isManager = user?.roles?.includes("manager");
  const isSecurity = user?.roles?.includes("security");

  // If security responder, use their assigned location
  React.useEffect(() => {
    if (isSecurity && userQuery.data?.location?.id) {
      setLocationId(userQuery.data.location.id);
    }
  }, [isSecurity, userQuery.data]);

  // Calculate date range based on filter
  const getDateRange = () => {
    if (!dateFilter) return {};
    const now = new Date();
    const hours = dateFilter === "24h" ? 24 : dateFilter === "7d" ? 168 : 720;
    const fromDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return {
      dateFrom: fromDate.toISOString(),
      dateTo: now.toISOString(),
    };
  };

  // Parse sort option into backend API format
  const [sortBy, sortOrder] = sortOption.split("_");

  // Force status to "Open" for security users
  const effectiveStatus = isSecurity ? "Open" : status;

  const { data, isLoading, isError, refetch } = useSecurityIncidents({
    locationId: locationId || undefined,
    status: effectiveStatus || undefined,
    sortBy: sortBy as "date" | "status",
    sortOrder: sortOrder as "asc" | "desc",
    ...getDateRange(),
  });

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text>{t("security.incident.failed_to_load")}</Text>
        <Button onPress={() => refetch()} className="mt-4">
          {t("security.retry")}
        </Button>
      </View>
    );
  }

  if (data) {
    return (
      <>
        <View className="flex-1 bg-white">
          {/* Header with filters and sort options */}
          <View className="border-b border-gray-200 p-4">
            <View className="flex-row flex-wrap gap-2">
              {!isSecurity && (
                <FormSelectField
                  label={t("security.filters.status")}
                  value={status}
                  onChange={(value) => setStatus(value)}
                  options={STATUS_OPTIONS}
                  style={{ flex: 1, minWidth: 150 }}
                  errors={[]}
                />
              )}
              <FormSelectField
                label={t("security.filters.date_range")}
                value={dateFilter}
                onChange={(value) => setDateFilter(value)}
                options={DATE_OPTIONS}
                style={{ flex: 1, minWidth: 150 }}
                errors={[]}
              />
              <FormSelectField
                label={t("security.filters.sort_by")}
                value={sortOption}
                onChange={(value) => setSortOption(value)}
                options={SORT_OPTIONS}
                style={{ flex: 1, minWidth: 150 }}
                errors={[]}
              />
            </View>
            {isManager && (
              <FormSelectField
                label={t("security.filters.location")}
                value={locationId}
                onChange={(value) => setLocationId(value)}
                options={locationOptions}
                style={{ marginTop: 8 }}
                errors={[]}
              />
            )}
          </View>

          {/* Incident list */}
          <FlatList
            role="list"
            data={data}
            keyExtractor={(item: ApiIncident) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
            renderItem={({ item }: { item: ApiIncident }) => (
              <View
                className="flex-row border-b border-gray-200 p-4"
                role="listitem"
              >
                <View className="flex-1">
                  <Text className="text-lg font-semibold">
                    {item.location?.name ||
                      t("security.incident.unknown_location")}
                  </Text>
                  <Text className="text-gray-600">
                    {t("security.incident.date_called")}:{" "}
                    {formatDate(item.dateCalled)}
                  </Text>
                  <View className="flex-row items-center">
                    {item.status === "Open" && <BlinkingDot />}
                    <Text className={STATUS_COLORS[item.status]}>
                      {t("security.incident.status")}: {item.status}
                    </Text>
                  </View>
                </View>
                <Link
                  href={{
                    pathname: "/security/incidents/[id]",
                    params: { id: item.id },
                  }}
                  asChild
                >
                  <Button className="mt-2">
                    {t("security.incident.view_details")}
                  </Button>
                </Link>
              </View>
            )}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center p-4">
                <Text>{t("security.incident.no_incidents")}</Text>
              </View>
            )}
          />
        </View>
      </>
    );
  }

  return <Loading />;
}
