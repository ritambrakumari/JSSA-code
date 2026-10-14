import fs from 'fs';
import path from 'path';

const filePath = 'd:/JSSA-main/backend/routes/employees.js';
let code = fs.readFileSync(filePath, 'utf8');

// 1. isStrictRM
const target1 = `    /** RM: strict — avoid PE/DM/etc. misclassified via loose substring checks on "regional". */
    const isStrictRM = (emp) => {
      if (!emp) return false;
      const r = (emp.role || '').toUpperCase();
      if (r === 'PE' || r === 'BS') return false;
      if (r === 'RM') return true;`;

const replacement1 = `    /** RM: strict — avoid PE/DM/etc. misclassified via loose substring checks on "regional". */
    const isStrictRM = (emp) => {
      if (!emp) return false;
      const r = (emp.role || '').toUpperCase();
      if (r === 'PE' || r === 'BS' || r === 'PM') return false;
      if (r === 'RM') return true;`;

// 2. isRole
const target2 = `    // Helper for Robust Role Comparison (uses strict RM)
    const isRole = (emp, targetRole) => {
      if (!emp) return false;
      const r = (emp.role || "").toUpperCase();
      const d = (emp.designation || "").toLowerCase();
      const p = (emp.jobPostingId?.post?.en || "").toLowerCase();

      if (targetRole === 'RM') return isStrictRM(emp);
      if (targetRole === 'ZC') return r === 'ZC' || d.includes('zonal') || p.includes('zonal');
      if (targetRole === 'DM') {
        if (r === 'ZC' || r === 'RM') return false; // Prevent higher roles from falling back to DM
        return r === 'DM' || d.includes('district manager') || p.includes('district manager');
      }
      if (targetRole === 'BS') {
        if (['RM', 'ZC', 'DM'].includes(r)) return false;
        return r === 'BS' || (d.includes('block') && d.includes('supervisor')) || (p.includes('block') && p.includes('supervisor'));
      }
      if (targetRole === 'PE') {
        if (['RM', 'ZC', 'DM', 'BS'].includes(r)) return false;
        return r === 'PE' || d.includes('panchayat') || p.includes('panchayat');
      }
      return false;
    };`;

const replacement2 = `    // Helper for Robust Role Comparison (uses strict RM)
    const isRole = (emp, targetRole) => {
      if (!emp) return false;
      const r = (emp.role || "").toUpperCase();
      const d = (emp.designation || "").toLowerCase();
      const p = (emp.jobPostingId?.post?.en || "").toLowerCase();

      if (targetRole === 'PM') return r === 'PM' || d.includes('project manager') || p.includes('project manager');
      if (targetRole === 'RM') return isStrictRM(emp);
      if (targetRole === 'ZC') {
        if (r === 'PM') return false;
        return r === 'ZC' || d.includes('zonal') || p.includes('zonal');
      }
      if (targetRole === 'DM') {
        if (['PM', 'RM', 'ZC'].includes(r)) return false; // Prevent higher roles from falling back to DM
        return r === 'DM' || d.includes('district manager') || p.includes('district manager');
      }
      if (targetRole === 'BS') {
        if (['PM', 'RM', 'ZC', 'DM'].includes(r)) return false;
        return r === 'BS' || (d.includes('block') && d.includes('supervisor')) || (p.includes('block') && p.includes('supervisor'));
      }
      if (targetRole === 'PE') {
        if (['PM', 'RM', 'ZC', 'DM', 'BS'].includes(r)) return false;
        return r === 'PE' || d.includes('panchayat') || p.includes('panchayat');
      }
      return false;
    };`;

// 3. roleOrder and index lookup
const target3 = `    // 2. Build Full Level-by-Level Path (including Vacant positions)
    const roleOrder = ['RM', 'ZC', 'DM', 'BS', 'PE'];
    const isRM = isRole(employee, 'RM');
    let myRoleIndex = roleOrder.indexOf(isRM ? 'RM' : (employee.role || 'DM').toUpperCase());
    if (myRoleIndex === -1) myRoleIndex = 2; // Default to DM if unknown`;

const replacement3 = `    // 2. Build Full Level-by-Level Path (including Vacant positions)
    const roleOrder = ['PM', 'RM', 'ZC', 'DM', 'BS', 'PE'];
    const isPM = isRole(employee, 'PM');
    const isRM = isRole(employee, 'RM');
    const computedRole = isPM ? 'PM' : (isRM ? 'RM' : (employee.role || 'DM').toUpperCase());
    let myRoleIndex = roleOrder.indexOf(computedRole);
    if (myRoleIndex === -1) myRoleIndex = 3; // Default to DM if unknown`;

// 4. Geographic / state match in the senior lookup loop
const target4 = `        if (targetRole === 'RM') return true;`;
const replacement4 = `        if (targetRole === 'PM' || targetRole === 'RM') return true;`;

// 5. roleNames map in senior path vacant placeholder
const target5 = `        const roleNames = { 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor' };`;
const replacement5 = `        const roleNames = { 'PM': 'Project Manager', 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor' };`;

// 6. roleOrd and PM block inside buildSubTree
const target6 = `        const roleOrd = ["RM", "ZC", "DM", "BS", "PE"];
        const nextRole = roleOrd[roleOrd.indexOf(levelRole) + 1];

        if (node) {
          const realSubs = subordinatesMap[managerId] || [];

          if (node.role === "RM") {`;

const replacement6 = `        const roleOrd = ["PM", "RM", "ZC", "DM", "BS", "PE"];
        const nextRole = roleOrd[roleOrd.indexOf(levelRole) + 1];

        if (node) {
          const realSubs = subordinatesMap[managerId] || [];

          if (node.role === "PM") {
            const stateRMs = allStateData.filter((e) => isStrictRM(e) && stateMatches(e.workingState, myState));
            const addedRmIds = new Set();

            stateRMs.forEach((rm) => {
              const rmId = (rm.userId?._id || rm.userId).toString();
              if (!addedRmIds.has(rmId)) {
                const sub = buildSubTree(rmId, "RM", { state: myState }, visited);
                if (sub) children.push(sub);
                addedRmIds.add(rmId);
              }
            });

            if (stateRMs.length === 0) {
              const rmVacId = \`vacant-rm-st-\${slugIdPart(myState)}\`;
              const vacantRmVisited = new Set(visited);
              const rmSubordinates = [];
              
              const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
              const addedZcIds = new Set();
              const managedNorm = managedDistrictNormKeysFromZCs(stateZCs);
              
              stateZCs.forEach((zc) => {
                const zcId = (zc.userId?._id || zc.userId).toString();
                if (!addedZcIds.has(zcId)) {
                  const sub = buildSubTree(zcId, "ZC", { state: myState }, vacantRmVisited);
                  if (sub) rmSubordinates.push(sub);
                  addedZcIds.add(zcId);
                }
              });
              
              const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
              vacantDistricts.forEach((distLabel) => {
                const zcVacId = \`vacant-zc-st-\${slugIdPart(myState)}-\${slugIdPart(distLabel)}\`;
                const inner = unmanagedZcChildren(distLabel, zcVacId, vacantRmVisited);
                rmSubordinates.push({
                  id: zcVacId,
                  name: "--",
                  post: "Zonal Coordinator",
                  role: "ZC",
                  isVacant: true,
                  zone: { state: myState, district: distLabel },
                  subordinates: inner,
                });
              });
              
              children.push({
                id: rmVacId,
                name: "--",
                post: "Regional Manager",
                role: "RM",
                isVacant: true,
                zone: { state: myState },
                subordinates: sortSubordinates(rmSubordinates)
              });
            }
          } else if (node.role === "RM") {`;

// 7. vacant PM check inside buildSubTree
const target7 = `        } else {
          if (levelRole === "RM") {
            const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));`;

const replacement7 = `        } else {
          if (levelRole === "PM") {
            const stateRMs = allStateData.filter((e) => isStrictRM(e) && stateMatches(e.workingState, myState));
            const addedRmIds = new Set();
            stateRMs.forEach((rm) => {
              const rmId = (rm.userId?._id || rm.userId).toString();
              if (!addedRmIds.has(rmId)) {
                const sub = buildSubTree(rmId, "RM", { state: myState }, visited);
                if (sub) children.push(sub);
                addedRmIds.add(rmId);
              }
            });
            if (stateRMs.length === 0) {
              const rmVacId = \`vacant-rm-st-\${slugIdPart(myState)}\`;
              const vacantRmVisited = new Set(visited);
              const rmSubordinates = [];
              const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
              const addedZcIds = new Set();
              const managedNorm = managedDistrictNormKeysFromZCs(stateZCs);
              stateZCs.forEach((zc) => {
                const zcId = (zc.userId?._id || zc.userId).toString();
                if (!addedZcIds.has(zcId)) {
                  const sub = buildSubTree(zcId, "ZC", { state: myState }, vacantRmVisited);
                  if (sub) rmSubordinates.push(sub);
                  addedZcIds.add(zcId);
                }
              });
              const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
              vacantDistricts.forEach((distLabel) => {
                const zcVacId = \`vacant-zc-st-\${slugIdPart(myState)}-\${slugIdPart(distLabel)}\`;
                const inner = unmanagedZcChildren(distLabel, zcVacId, vacantRmVisited);
                rmSubordinates.push({
                  id: zcVacId,
                  name: "--",
                  post: "Zonal Coordinator",
                  role: "ZC",
                  isVacant: true,
                  zone: { state: myState, district: distLabel },
                  subordinates: inner,
                });
              });
              children.push({
                id: rmVacId,
                name: "--",
                post: "Regional Manager",
                role: "RM",
                isVacant: true,
                zone: { state: myState },
                subordinates: sortSubordinates(rmSubordinates)
              });
            }
          } else if (levelRole === "RM") {
            const stateZCs = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));`;

// 8. roleNames map in buildSubTree return
const target8 = `        if (node) {
          const roleNames = { 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor', 'PE': 'Panchayat Executive' };`;
const replacement8 = `        if (node) {
          const roleNames = { 'PM': 'Project Manager', 'RM': 'Regional Manager', 'ZC': 'Zonal Coordinator', 'DM': 'District Manager', 'BS': 'Block Supervisor', 'PE': 'Panchayat Executive' };`;

// 9. Root fullTree building
const target9 = `      // 4. Find the Root RM for the state and build FULL tree first
      const stateRM = allStateData.find((emp) => isStrictRM(emp) && stateMatches(emp.workingState, myState));

      let fullTree = null;
      if (stateRM) {
        fullTree = buildSubTree((stateRM.userId?._id || stateRM.userId).toString(), "RM", { state: myState });
      } else {
        fullTree = {
          id: \`vacant-rm-\${slugIdPart(myState)}\`,
          name: "--",
          post: "Regional Manager",
          role: "RM",
          isVacant: true,
          zone: { state: myState },
          subordinates: [],
        };

        const vacantRootVisited = new Set();
        const stateZCsVacantRm = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
        const addedZcIdsVac = new Set();
        const managedNorm = managedDistrictNormKeysFromZCs(stateZCsVacantRm);

        stateZCsVacantRm.forEach((zc) => {
          const zcId = (zc.userId?._id || zc.userId).toString();
          if (!addedZcIdsVac.has(zcId)) {
            const sub = buildSubTree(zcId, "ZC", { state: myState }, vacantRootVisited);
            if (sub) fullTree.subordinates.push(sub);
            addedZcIdsVac.add(zcId);
          }
        });

        const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
        vacantDistricts.forEach((distLabel) => {
          const zcVacId = \`vacant-zc-st-\${slugIdPart(myState)}-\${slugIdPart(distLabel)}\`;
          fullTree.subordinates.push({
            id: zcVacId,
            name: "--",
            post: "Zonal Coordinator",
            role: "ZC",
            isVacant: true,
            zone: { state: myState, district: distLabel },
            subordinates: unmanagedZcChildren(distLabel, zcVacId, vacantRootVisited),
          });
        });

        fullTree.subordinates = sortSubordinates(fullTree.subordinates);
      }`;

const replacement9 = `      // 4. Find the Root PM or RM for the state and build FULL tree first
      const statePM = allStateData.find((emp) => isRole(emp, "PM") && stateMatches(emp.workingState, myState));
      const stateRM = allStateData.find((emp) => isStrictRM(emp) && stateMatches(emp.workingState, myState));

      let fullTree = null;
      if (statePM) {
        fullTree = buildSubTree((statePM.userId?._id || statePM.userId).toString(), "PM", { state: myState });
      } else if (stateRM) {
        const pmVacId = \`vacant-pm-\${slugIdPart(myState)}\`;
        const vacantPmVisited = new Set();
        const pmSubordinates = [];
        
        const rmSub = buildSubTree((stateRM.userId?._id || stateRM.userId).toString(), "RM", { state: myState }, vacantPmVisited);
        if (rmSub) pmSubordinates.push(rmSub);
        
        fullTree = {
          id: pmVacId,
          name: "--",
          post: "Project Manager",
          role: "PM",
          isVacant: true,
          zone: { state: myState },
          subordinates: pmSubordinates
        };
      } else {
        const pmVacId = \`vacant-pm-\${slugIdPart(myState)}\`;
        const rmVacId = \`vacant-rm-\${slugIdPart(myState)}\`;
        
        const vacantPmVisited = new Set();
        const rmSubordinates = [];
        const stateZCsVacantRm = allStateData.filter((e) => e.role === "ZC" && stateMatches(e.workingState, myState));
        const addedZcIdsVac = new Set();
        const managedNorm = managedDistrictNormKeysFromZCs(stateZCsVacantRm);

        stateZCsVacantRm.forEach((zc) => {
          const zcId = (zc.userId?._id || zc.userId).toString();
          if (!addedZcIdsVac.has(zcId)) {
            const sub = buildSubTree(zcId, "ZC", { state: myState }, vacantPmVisited);
            if (sub) rmSubordinates.push(sub);
            addedZcIdsVac.add(zcId);
          }
        });

        const vacantDistricts = unmanagedDmDistrictLabels(managedNorm);
        vacantDistricts.forEach((distLabel) => {
          const zcVacId = \`vacant-zc-st-\${slugIdPart(myState)}-\${slugIdPart(distLabel)}\`;
          rmSubordinates.push({
            id: zcVacId,
            name: "--",
            post: "Zonal Coordinator",
            role: "ZC",
            isVacant: true,
            zone: { state: myState, district: distLabel },
            subordinates: unmanagedZcChildren(distLabel, zcVacId, vacantPmVisited),
          });
        });

        fullTree = {
          id: pmVacId,
          name: "--",
          post: "Project Manager",
          role: "PM",
          isVacant: true,
          zone: { state: myState },
          subordinates: [
            {
              id: rmVacId,
              name: "--",
              post: "Regional Manager",
              role: "RM",
              isVacant: true,
              zone: { state: myState },
              subordinates: sortSubordinates(rmSubordinates)
            }
          ]
        };
      }`;

// 10. Scoped tree selection
const target10 = `      const myRoleUpper = isRM ? "RM" : (employee.role || "").toUpperCase();

      let scopedRoot;

      if (myRoleUpper === "RM") {
        // RM sees full tree from themselves
        scopedRoot = fullTree;
      } else {
        // For non-RM roles: find direct senior node (1 level above) as root
        // path[] is top-to-bottom, last item = immediate senior
        const seniorPathItem = hierarchy.path && hierarchy.path.length > 0
          ? hierarchy.path[hierarchy.path.length - 1]
          : null;

        let seniorNode = null;

        if (seniorPathItem && !seniorPathItem.isVacant) {
          // Find that senior in the full tree by their employee _id
          seniorNode = findNodeInTree(fullTree, (seniorPathItem.id || "").toString());
        }

        if (!seniorNode) {
          // Senior is vacant or not found — build a focused vacant senior node
          const roleNames = {
            RM: "Regional Manager",
            ZC: "Zonal Coordinator",
            DM: "District Manager",
            BS: "Block Supervisor",
          };
          const roleOrder2 = ["RM", "ZC", "DM", "BS", "PE"];
          const myIdx = roleOrder2.indexOf(myRoleUpper);
          const seniorRole = myIdx > 0 ? roleOrder2[myIdx - 1] : "RM";

          // Find self node to attach as subordinate under vacant senior
          const myEmpId = (employee._id || "").toString();
          const selfNode = findNodeInTree(fullTree, myEmpId);

          scopedRoot = {
            id: seniorPathItem?.id || \`vacant-\${seniorRole.toLowerCase()}-for-\${myEmpId}\`,
            name: "--",
            post: roleNames[seniorRole] || seniorRole,
            role: seniorRole,
            isVacant: true,
            zone: { state: employee.workingState, district: employee.workingDistrict },
            subordinates: selfNode ? [selfNode] : [],
          };
        } else {
          scopedRoot = seniorNode;
        }
      }`;

const replacement10 = `      const myRoleUpper = isPM ? "PM" : (isRM ? "RM" : (employee.role || "").toUpperCase());

      let scopedRoot;

      if (myRoleUpper === "PM" || myRoleUpper === "RM") {
        // PM and RM see full tree starting from PM
        scopedRoot = fullTree;
      } else {
        // For non-RM/PM roles: find direct senior node (1 level above) as root
        // path[] is top-to-bottom, last item = immediate senior
        const seniorPathItem = hierarchy.path && hierarchy.path.length > 0
          ? hierarchy.path[hierarchy.path.length - 1]
          : null;

        let seniorNode = null;

        if (seniorPathItem && !seniorPathItem.isVacant) {
          // Find that senior in the full tree by their employee _id
          seniorNode = findNodeInTree(fullTree, (seniorPathItem.id || "").toString());
        }

        if (!seniorNode) {
          // Senior is vacant or not found — build a focused vacant senior node
          const roleNames = {
            PM: "Project Manager",
            RM: "Regional Manager",
            ZC: "Zonal Coordinator",
            DM: "District Manager",
            BS: "Block Supervisor",
          };
          const roleOrder2 = ["PM", "RM", "ZC", "DM", "BS", "PE"];
          const myIdx = roleOrder2.indexOf(myRoleUpper);
          const seniorRole = myIdx > 0 ? roleOrder2[myIdx - 1] : "PM";

          // Find self node to attach as subordinate under vacant senior
          const myEmpId = (employee._id || "").toString();
          const selfNode = findNodeInTree(fullTree, myEmpId);

          scopedRoot = {
            id: seniorPathItem?.id || \`vacant-\${seniorRole.toLowerCase()}-for-\${myEmpId}\`,
            name: "--",
            post: roleNames[seniorRole] || seniorRole,
            role: seniorRole,
            isVacant: true,
            zone: { state: employee.workingState, district: employee.workingDistrict },
            subordinates: selfNode ? [selfNode] : [],
          };
        } else {
          scopedRoot = seniorNode;
        }
      }`;

// 11. rebuildGlobalHierarchy definition
const target11 = `    // Reset all reportingTo
    for (const emp of employees) {
      emp.reportingTo = null;
    }

    // Classify by role
    const dms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "DM" || post.includes("district manager");
    });

    const zcs = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "ZC" || post.includes("zonal coordinator");
    });

    const rms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "RM" || post.includes("regional manager");
    });

    const bss = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "BS" || post.includes("block supervisor");
    });

    const pes = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PE" || post.includes("panchayat executive");
    });

    // ZC reports to RM
    for (const zc of zcs) {
      const myState = zc.workingState;
      const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
      if (rm) zc.reportingTo = rm.userId;
    }

    // DM reports to ZC or RM
    for (const dm of dms) {
      const myDistrict = dm.workingDistrict;
      const zc = zcs.find(z => {
        if (!z.workingDistrict) return false;
        const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
        return zcDistricts.includes(norm(myDistrict));
      });
      if (zc) {
        dm.reportingTo = zc.userId;
      } else {
        const myState = dm.workingState;
        const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
        if (rm) dm.reportingTo = rm.userId;
      }
    }`;

const replacement11 = `    // Reset all reportingTo
    for (const emp of employees) {
      emp.reportingTo = null;
    }

    // Classify by role
    const pms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PM" || post.includes("project manager");
    });

    const rms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "RM" || post.includes("regional manager");
    });

    const zcs = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "ZC" || post.includes("zonal coordinator");
    });

    const dms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "DM" || post.includes("district manager");
    });

    const bss = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "BS" || post.includes("block supervisor");
    });

    const pes = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PE" || post.includes("panchayat executive");
    });

    // RM reports to PM
    for (const rm of rms) {
      const myState = rm.workingState;
      const pm = pms.find(p => p.workingState && norm(p.workingState) === norm(myState));
      if (pm) rm.reportingTo = pm.userId;
    }

    // ZC reports to RM or PM
    for (const zc of zcs) {
      const myState = zc.workingState;
      const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
      if (rm) {
        zc.reportingTo = rm.userId;
      } else {
        const pm = pms.find(p => p.workingState && norm(p.workingState) === norm(myState));
        if (pm) zc.reportingTo = pm.userId;
      }
    }

    // DM reports to ZC or RM or PM
    for (const dm of dms) {
      const myDistrict = dm.workingDistrict;
      const zc = zcs.find(z => {
        if (!z.workingDistrict) return false;
        const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
        return zcDistricts.includes(norm(myDistrict));
      });
      if (zc) {
        dm.reportingTo = zc.userId;
      } else {
        const myState = dm.workingState;
        const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
        if (rm) {
          dm.reportingTo = rm.userId;
        } else {
          const pm = pms.find(p => p.workingState && norm(p.workingState) === norm(myState));
          if (pm) dm.reportingTo = pm.userId;
        }
      }
    }`;

// 12. Export statement at the bottom
const target12 = `export default router;`;
const replacement12 = `export { rebuildGlobalHierarchy };
export default router;`;

function applyReplace(tar, rep, desc) {
  if (!code.includes(tar)) {
    console.error(`ERROR: Target not found for: ${desc}`);
    process.exit(1);
  }
  code = code.replace(tar, rep);
  console.log(`SUCCESS: Applied replacement for: ${desc}`);
}

applyReplace(target1, replacement1, "isStrictRM exclusion");
applyReplace(target2, replacement2, "isRole robust checks");
applyReplace(target3, replacement3, "roleOrder & computation");
applyReplace(target4, replacement4, "geographic state priority in senior loop");
applyReplace(target5, replacement5, "roleNames PM in senior loop vacant placeholder");
applyReplace(target6, replacement6, "buildSubTree PM block integration");
applyReplace(target7, replacement7, "buildSubTree vacant PM block fallback integration");
applyReplace(target8, replacement8, "roleNames PM mapping in node populator");
applyReplace(target9, replacement9, "Full tree root building from PM");
applyReplace(target10, replacement10, "Scoped tree selection with PM/RM root");
applyReplace(target11, replacement11, "rebuildGlobalHierarchy with PM root assignments");
applyReplace(target12, replacement12, "rebuildGlobalHierarchy named export");

fs.writeFileSync(filePath, code, 'utf8');
console.log("All employee routes patched successfully!");
