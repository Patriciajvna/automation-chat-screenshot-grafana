const getGroupId = (client) => {
    return async (req, res, next) => {
        // console.log(req)
        let chatId = req.body.id;
        const groupName = req.body.name;
        req.body.chatId = chatId
        if (!chatId) {
            const group = await findGroupByName(client, groupName);
            if (!group) {
                return res.status(422).json({
                    status: false,
                    message: "No group found with name: " + groupName,
                });
            }
            req.body.chatId = group.id._serialized;
        }
        next()
    }
}

const findGroupByName = async function (client, name) {
    return await client.getChats().then((chats) => {
        return chats.find(
            (chat) => chat.isGroup && chat.name.toLowerCase() === name.toLowerCase()
        );
    });
};

module.exports = {
    getGroupId,
    findGroupByName
}