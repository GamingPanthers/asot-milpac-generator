import { Member } from '../models';
import { StoredMember, MemberData } from '../types';
import logger from '../utils/logger';

/**
 * Member storage and retrieval service
 */
export class MemberService {
  /**
   * Get member from database
   */
  async getMember(memberID: string): Promise<StoredMember | null> {
    try {
      const member = await Member.findOne({ memberID });
      return member as StoredMember | null;
    } catch (error) {
      logger.error('Failed to fetch member', { memberID, error });
      throw error;
    }
  }

  /**
   * Save or update member
   */
  async saveMember(memberID: string, name: string, discordID: string, data: MemberData): Promise<StoredMember> {
    try {
      const member = await Member.findOneAndUpdate(
        { memberID },
        {
          memberID,
          name,
          discordID,
          data,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.info('Member saved', { memberID, name });
      return member as StoredMember;
    } catch (error) {
      logger.error('Failed to save member', { memberID, error });
      throw error;
    }
  }

  /**
   * Update member image metadata
   */
  async updateMemberImage(memberID: string, imageUrl: string): Promise<StoredMember | null> {
    try {
      const member = await Member.findOneAndUpdate(
        { memberID },
        {
          imageUrl,
          lastGenerated: new Date(),
        },
        { new: true }
      );
      logger.info('Member image updated', { memberID, imageUrl });
      return member as StoredMember | null;
    } catch (error) {
      logger.error('Failed to update member image', { memberID, error });
      throw error;
    }
  }

  /**
   * Detect changes in member data
   */
  detectChanges(oldData: MemberData | null, newData: MemberData, changeFields: string[]): boolean {
    // If no old data, consider it a change
    if (!oldData) {
      return true;
    }

    // Check if any of the change fields are actually different
    for (const field of changeFields) {
      const oldValue = (oldData as any)[field];
      const newValue = (newData as any)[field];

      // Handle arrays
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())) {
          logger.debug('Change detected', { field, oldValue, newValue });
          return true;
        }
      } else if (oldValue !== newValue) {
        logger.debug('Change detected', { field, oldValue, newValue });
        return true;
      }
    }

    return false;
  }
}

export default new MemberService();
