// બધો જ ડેટા (બધા જ પેજિસમાંથી) ડાઉનલોડ કરવા માટેનું ફંક્શન
  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      let allLeads = [];
      let currentPage = 1;
      let totalPages = 1;

      // ડેટાબેઝના બધા જ પેજમાંથી લૂપ ચલાવીને ડેટા ભેગા કરો
      do {
        const response = await leadService.fetchLeads({
          ...filters,
          page: currentPage,
          limit: 100, // એક પેજ પરથી 100 રેકોર્ડ્સ ખેંચો
        });

        const result = response?.data ?? response;
        const leadsData = Array.isArray(result?.leads) ? result.leads : [];
        const apiPagination = result?.pagination || {};
        
        // કુલ પેજની ગણતરી કરો
        const totalItems = Number(apiPagination.totalLeads ?? apiPagination.totalItems ?? 0);
        totalPages = apiPagination.totalPages || Math.ceil(totalItems / 100) || 1;

        if (leadsData.length > 0) {
          allLeads = [...allLeads, ...leadsData];
        }

        currentPage++;
      } while (currentPage <= totalPages);

      if (allLeads.length === 0) {
        alert("ડાઉનલોડ કરવા માટે કોઈ લીડ ડેટા ઉપલબ્ધ નથી.");
        return;
      }

      const headers = [
        "Name",
        "Company",
        "Email",
        "Status",
        "Source",
        "Priority",
        "Created At",
      ];

      const rows = allLeads.map((lead) => [
        `"${lead.name || lead.Name || ""}"`,
        `"${lead.company || lead.Company || ""}"`,
        `"${lead.phone || lead.Phone || ""}"`,
        `"${lead.assignedto || lead.Assignedto || ""}"`,
        `"${lead.email || lead.Email || ""}"`,
        `"${lead.status || "New"}"`,
        `"${lead.source || "Website"}"`,
        `"${lead.priority || "Medium"}"`,
        `"${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""}"`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `all_leads_registry_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("બધા લીડ ડેટા ડાઉનલોડ કરતી વખતે ભૂલ થઈ છે.");
    } finally {
      setIsLoading(false);
    }
  };