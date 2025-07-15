/**
 * Copyright 2024 Zheng He
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function (RED) {
    
    function ApiConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // 保存配置
        node.name = config.name;
        node.provider = config.provider;
        node.model = config.model;
        node.useDifferentModels = config.useDifferentModels;
        
        // 获取API密钥（从凭证中）
        node.apiKey = this.credentials.apiKey;
    }

    // 注册API配置节点，包括凭证处理
    RED.nodes.registerType('api-config', ApiConfigNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
}
