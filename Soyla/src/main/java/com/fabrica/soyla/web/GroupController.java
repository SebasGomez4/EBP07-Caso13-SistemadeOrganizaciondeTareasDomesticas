package com.fabrica.soyla.web;

import java.util.List;
import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fabrica.soyla.service.SoylaService;
import com.fabrica.soyla.web.ApiModels.AssignTaskRequest;
import com.fabrica.soyla.web.ApiModels.CreateRankingRequest;
import com.fabrica.soyla.web.ApiModels.CreateGroupRequest;
import com.fabrica.soyla.web.ApiModels.CreateTaskRequest;
import com.fabrica.soyla.web.ApiModels.GroupActionRequest;
import com.fabrica.soyla.web.ApiModels.GroupMemberResponse;
import com.fabrica.soyla.web.ApiModels.GroupResponse;
import com.fabrica.soyla.web.ApiModels.InviteResponse;
import com.fabrica.soyla.web.ApiModels.NotificationResponse;
import com.fabrica.soyla.web.ApiModels.TaskResponse;
import com.fabrica.soyla.web.ApiModels.UpdateMemberRoleRequest;
import com.fabrica.soyla.web.ApiModels.UpdateTaskStatusRequest;
import com.fabrica.soyla.web.ApiModels.WeeklyRankingResponse;

@RestController
@Validated
@RequestMapping("/api")
public class GroupController {

    private final SoylaService soylaService;

    public GroupController(SoylaService soylaService) {
        this.soylaService = soylaService;
    }

    @PostMapping("/groups")
    public GroupResponse createGroup(@RequestBody @jakarta.validation.Valid CreateGroupRequest request) {
        return soylaService.createGroup(request);
    }

    @GetMapping("/groups")
    public List<GroupResponse> listGroups(@RequestParam String memberEmail) {
        return soylaService.listGroupsForMember(memberEmail);
    }

    @GetMapping("/groups/{groupId}")
    public GroupResponse getGroup(@PathVariable UUID groupId) {
        return soylaService.getGroup(groupId);
    }

    @GetMapping("/groups/{groupId}/members")
    public List<GroupMemberResponse> listMembers(@PathVariable UUID groupId) {
        return soylaService.listMembers(groupId);
    }

    @PutMapping("/groups/{groupId}/members/{memberEmail}/role")
    public GroupMemberResponse updateRole(
        @PathVariable UUID groupId,
        @PathVariable String memberEmail,
        @RequestBody @jakarta.validation.Valid UpdateMemberRoleRequest request
    ) {
        return soylaService.updateMemberRole(groupId, memberEmail, request);
    }

    @DeleteMapping("/groups/{groupId}/members/{memberEmail}")
    public void leaveGroup(@PathVariable UUID groupId, @PathVariable String memberEmail) {
        soylaService.leaveGroup(groupId, memberEmail);
    }

    @DeleteMapping("/groups/{groupId}")
    public void deleteGroup(
        @PathVariable UUID groupId,
        @RequestBody @jakarta.validation.Valid GroupActionRequest request
    ) {
        soylaService.deleteGroup(groupId, request);
    }

    @GetMapping("/groups/{groupId}/invite")
    public InviteResponse getActiveInvite(@PathVariable UUID groupId) {
        return soylaService.getActiveInvite(groupId);
    }

    @PostMapping("/groups/{groupId}/invite")
    public InviteResponse createInvite(@PathVariable UUID groupId) {
        return soylaService.createOrReuseInvite(groupId);
    }

    @GetMapping("/groups/{groupId}/tasks")
    public List<TaskResponse> listTasks(@PathVariable UUID groupId) {
        return soylaService.listTasks(groupId);
    }

    @PostMapping("/groups/{groupId}/tasks")
    public TaskResponse createTask(
        @PathVariable UUID groupId,
        @RequestBody @jakarta.validation.Valid CreateTaskRequest request
    ) {
        return soylaService.createTask(groupId, request);
    }

    @PutMapping("/tasks/{taskId}/assignee")
    public TaskResponse assignTask(
        @PathVariable UUID taskId,
        @RequestBody @jakarta.validation.Valid AssignTaskRequest request
    ) {
        return soylaService.assignTask(taskId, request);
    }

    @PutMapping("/tasks/{taskId}/status")
    public TaskResponse updateTaskStatus(
        @PathVariable UUID taskId,
        @RequestBody @jakarta.validation.Valid UpdateTaskStatusRequest request
    ) {
        return soylaService.updateTaskStatus(taskId, request);
    }

    @DeleteMapping("/tasks/{taskId}")
    public void deleteTask(@PathVariable UUID taskId) {
        soylaService.deleteTask(taskId);
    }

    @PostMapping("/groups/{groupId}/ranking")
    public WeeklyRankingResponse createWeeklyRanking(
        @PathVariable UUID groupId,
        @RequestBody @jakarta.validation.Valid CreateRankingRequest request
    ) {
        return soylaService.createWeeklyRanking(groupId, request);
    }

    @GetMapping("/groups/{groupId}/ranking")
    public WeeklyRankingResponse getWeeklyRanking(@PathVariable UUID groupId) {
        return soylaService.getWeeklyRanking(groupId);
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> listNotifications(@RequestParam String email) {
        return soylaService.listNotifications(email);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public NotificationResponse markNotificationRead(
        @PathVariable UUID notificationId,
        @RequestParam String email
    ) {
        return soylaService.markNotificationRead(notificationId, email);
    }

    @PutMapping("/notifications/read-all")
    public void markAllNotificationsRead(@RequestParam String email) {
        soylaService.markAllNotificationsRead(email);
    }
}
